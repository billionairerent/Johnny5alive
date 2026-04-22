import { ScoredLead } from "../types/scoredLead";
import { renderPrompt, loadPrompt } from "../lib/promptLoader";
import { getLLMClient, extractJson, StubLLMClient } from "./client";
import { logger } from "../lib/logger";
import { safeString, truncate } from "../lib/textUtils";

export type ScriptChannel = "sms" | "email" | "call";

export interface ScriptOutput {
  leadId: string;
  channel: ScriptChannel;
  subject?: string;
  body: string;
  fallbackBody: string;
  tone: string;
}

/**
 * Generate an outreach script for a given channel and lead.
 */
export async function generateScript(
  scored: ScoredLead,
  channel: ScriptChannel
): Promise<ScriptOutput> {
  const client = getLLMClient();
  if (!(client instanceof StubLLMClient)) {
    try {
      const system = loadPrompt("core_system_prompt");
      const user = renderPrompt("generate_script", {
        lead: scored,
        channel,
        leadType: scored.leadType,
      });
      const res = await client.complete({ system, user, json: true });
      const parsed = extractJson(res.text) as Partial<ScriptOutput>;
      if (parsed.body) {
        return {
          leadId: scored.leadId,
          channel,
          subject: parsed.subject,
          body: enforceChannelLimits(channel, safeString(parsed.body)),
          fallbackBody: enforceChannelLimits(
            channel,
            safeString(parsed.fallbackBody, parsed.body)
          ),
          tone: safeString(parsed.tone, "friendly"),
        };
      }
    } catch (err) {
      logger.warn("generateScript LLM call failed; falling back", {
        error: (err as Error).message,
      });
    }
  }

  return fallbackScript(scored, channel);
}

export function fallbackScript(
  scored: ScoredLead,
  channel: ScriptChannel
): ScriptOutput {
  const base = scored.suggestedScript || defaultLine(scored);
  const body = enforceChannelLimits(channel, base);
  const fallbackBody = enforceChannelLimits(
    channel,
    "Just wanted to make sure this reached you — happy to answer any questions whenever works."
  );
  return {
    leadId: scored.leadId,
    channel,
    subject: channel === "email" ? "Quick question for you" : undefined,
    body,
    fallbackBody,
    tone: "friendly",
  };
}

function defaultLine(scored: ScoredLead): string {
  if (scored.leadType === "seller") {
    return "Following up on your property. Happy to work around your timeline — any questions I can answer?";
  }
  return "Following up on your home search. We work with owners directly, so happy to share options outside the bank route.";
}

function enforceChannelLimits(channel: ScriptChannel, body: string): string {
  if (channel === "sms") return truncate(body, 320);
  return body;
}
