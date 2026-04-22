import { ScoredLead } from "../types/scoredLead";
import { renderPrompt, loadPrompt } from "../lib/promptLoader";
import { getLLMClient, extractJson, StubLLMClient } from "./client";
import { logger } from "../lib/logger";
import { addDaysIso } from "../lib/dateUtils";
import { safeString } from "../lib/textUtils";

export interface FollowupPlan {
  leadId: string;
  leadType: string;
  followupDay1: string;
  followupDay3: string;
  followupDay7: string;
  tone: string;
  scriptSuggestions: string[];
}

/**
 * Build a follow-up plan for a scored lead.
 */
export async function followupPlan(scored: ScoredLead): Promise<FollowupPlan> {
  const client = getLLMClient();
  if (!(client instanceof StubLLMClient)) {
    try {
      const system = loadPrompt("core_system_prompt");
      const user = renderPrompt("followup_plan", { lead: scored });
      const res = await client.complete({ system, user, json: true });
      const parsed = extractJson(res.text) as Partial<FollowupPlan>;
      if (parsed.followupDay1 || parsed.scriptSuggestions) {
        return {
          leadId: scored.leadId,
          leadType: scored.leadType,
          followupDay1: safeString(parsed.followupDay1, addDaysIso(1)),
          followupDay3: safeString(parsed.followupDay3, addDaysIso(3)),
          followupDay7: safeString(parsed.followupDay7, addDaysIso(7)),
          tone: safeString(parsed.tone, "friendly"),
          scriptSuggestions: parsed.scriptSuggestions ?? [],
        };
      }
    } catch (err) {
      logger.warn("followupPlan LLM call failed; falling back", {
        error: (err as Error).message,
      });
    }
  }

  return fallbackPlan(scored);
}

export function fallbackPlan(scored: ScoredLead): FollowupPlan {
  const suggestions = [
    scored.suggestedScript || "Day 1: thank-you + confirm next step.",
    "Day 3: helpful check-in + one clarifying question.",
    "Day 7: soft re-engage + alternative path.",
  ];
  return {
    leadId: scored.leadId,
    leadType: scored.leadType,
    followupDay1: addDaysIso(1),
    followupDay3: addDaysIso(3),
    followupDay7: addDaysIso(7),
    tone: "friendly",
    scriptSuggestions: suggestions,
  };
}
