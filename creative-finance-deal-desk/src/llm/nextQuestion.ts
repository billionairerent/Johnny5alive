import { ScoredLead } from "../types/scoredLead";
import { renderPrompt, loadPrompt } from "../lib/promptLoader";
import { getLLMClient, extractJson, StubLLMClient } from "./client";
import { logger } from "../lib/logger";
import { safeString } from "../lib/textUtils";

export interface NextQuestion {
  leadId: string;
  nextQuestion: string;
  reason: string;
  tone: string;
}

/**
 * Pick the single best next question to ask a lead, based on their scored
 * state. LLM-first with a deterministic fallback.
 */
export async function nextQuestion(scored: ScoredLead): Promise<NextQuestion> {
  const client = getLLMClient();
  if (!(client instanceof StubLLMClient)) {
    try {
      const system = loadPrompt("core_system_prompt");
      const user = renderPrompt("next_question", { lead: scored });
      const res = await client.complete({ system, user, json: true });
      const parsed = extractJson(res.text) as Partial<NextQuestion>;
      if (parsed.nextQuestion) {
        return {
          leadId: scored.leadId,
          nextQuestion: safeString(parsed.nextQuestion),
          reason: safeString(parsed.reason, "fills a known gap"),
          tone: safeString(parsed.tone, "friendly"),
        };
      }
    } catch (err) {
      logger.warn("nextQuestion LLM call failed; falling back", {
        error: (err as Error).message,
      });
    }
  }

  return fallbackNextQuestion(scored);
}

export function fallbackNextQuestion(scored: ScoredLead): NextQuestion {
  const missing = scored.missingFacts[0];
  if (missing) {
    return {
      leadId: scored.leadId,
      nextQuestion: defaultPrompt(scored.leadType, missing),
      reason: `fills missing fact: ${missing}`,
      tone: "friendly",
    };
  }
  return {
    leadId: scored.leadId,
    nextQuestion: "Just checking in — is now still a good time to chat about this?",
    reason: "low-pressure reconnect",
    tone: "warm",
  };
}

function defaultPrompt(leadType: string, field: string): string {
  if (leadType === "seller") {
    switch (field) {
      case "asking price":
        return "What price were you hoping to get for the property?";
      case "mortgage balance":
        return "Is there still a loan on the property, and roughly how much is owed?";
      case "timeline":
        return "How soon are you hoping to sell?";
      case "flexibility":
        return "Would you consider flexible terms if the right buyer came along?";
      case "occupancy":
        return "Is the property occupied right now or vacant?";
      default:
        return `Could you share a bit more about the ${field}?`;
    }
  }
  // buyer
  switch (field) {
    case "down payment":
      return "Roughly how much do you have available for a down payment?";
    case "target area":
      return "What areas or neighborhoods are you focused on?";
    case "budget":
      return "What price range fits you best?";
    case "timeline":
      return "How soon are you hoping to move?";
    case "monthly income":
      return "Roughly what does your monthly income look like?";
    default:
      return `Could you share a bit more about your ${field}?`;
  }
}
