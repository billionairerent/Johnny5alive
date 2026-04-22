import { BuyerLead } from "../types/buyer";
import { ScoredLead } from "../types/scoredLead";
import { renderPrompt, loadPrompt } from "../lib/promptLoader";
import { validate } from "../lib/schemaValidator";
import { getLLMClient, extractJson, StubLLMClient } from "./client";
import { logger } from "../lib/logger";
import { safeString } from "../lib/textUtils";

/**
 * Classify a buyer lead — LLM-first with heuristic fallback.
 */
export async function classifyBuyer(lead: BuyerLead): Promise<ScoredLead> {
  const client = getLLMClient();

  if (!(client instanceof StubLLMClient)) {
    try {
      const system = loadPrompt("core_system_prompt");
      const user = renderPrompt("classify_buyer", { buyerLead: lead });
      const res = await client.complete({ system, user, json: true });
      const parsed = extractJson(res.text) as Partial<ScoredLead>;
      const candidate: ScoredLead = {
        leadId: lead.leadId,
        leadType: "buyer",
        status: safeString(parsed.status, "Developing"),
        score: typeof parsed.score === "number" ? parsed.score : 0,
        knownFacts: parsed.knownFacts ?? [],
        missingFacts: parsed.missingFacts ?? [],
        riskFlags: parsed.riskFlags ?? [],
        nextAction: safeString(parsed.nextAction, "Follow up"),
        followupWindow: safeString(parsed.followupWindow, "24h"),
        suggestedScript: safeString(parsed.suggestedScript, ""),
        escalation: safeString(parsed.escalation, "NONE"),
      };
      const { valid, errors } = validate("scoredLead", candidate);
      if (valid) return candidate;
      logger.warn("LLM buyer classification failed schema; falling back", { errors });
    } catch (err) {
      logger.warn("LLM buyer classification threw; falling back", {
        error: (err as Error).message,
      });
    }
  }

  return heuristicBuyerScore(lead);
}

export function heuristicBuyerScore(lead: BuyerLead): ScoredLead {
  const known: string[] = [];
  const missing: string[] = [];
  const risks: string[] = [];
  let score = 0;

  // down payment strength 0-3
  const dp = asNumber(lead.downPayment);
  const budget = asNumber(lead.budget);
  if (dp !== null && budget && budget > 0) {
    const ratio = dp / budget;
    if (ratio >= 0.15) {
      score += 3;
      known.push(`strong down payment (${Math.round(ratio * 100)}%)`);
    } else if (ratio >= 0.08) {
      score += 2;
      known.push(`moderate down payment (${Math.round(ratio * 100)}%)`);
    } else if (ratio > 0) {
      score += 1;
      known.push(`light down payment (${Math.round(ratio * 100)}%)`);
    } else {
      risks.push("no down payment");
    }
  } else if (dp !== null && dp > 0) {
    score += 2;
    known.push(`down payment ${lead.downPayment}`);
  } else {
    missing.push("down payment");
  }

  // timeline / urgency 0-2
  const timeline = safeString(lead.timeline).toLowerCase();
  if (/asap|immediately|30|month/.test(timeline)) {
    score += 2;
    known.push("urgent timeline");
  } else if (/60|90|quarter/.test(timeline)) {
    score += 1;
    known.push("near-term timeline");
  } else if (!timeline) {
    missing.push("timeline");
  }

  // income stability 0-2
  if (lead.monthlyIncome !== undefined && lead.monthlyIncome !== null && lead.monthlyIncome !== "") {
    const income = asNumber(lead.monthlyIncome);
    if (income !== null && income >= 6000) {
      score += 2;
      known.push(`income ${lead.monthlyIncome}`);
    } else if (income !== null && income > 0) {
      score += 1;
      known.push(`income ${lead.monthlyIncome}`);
    }
  } else {
    missing.push("monthly income");
  }

  // data completeness 0-2
  if (lead.targetArea) {
    score += 1;
    known.push(`target area ${lead.targetArea}`);
  } else {
    missing.push("target area");
  }
  if (budget && budget > 0) {
    score += 1;
    known.push(`budget ${lead.budget}`);
  } else {
    missing.push("budget");
  }

  // risk scan on notes / credit
  const notes = safeString(lead.notes).toLowerCase();
  const credit = safeString(lead.creditSituation).toLowerCase();
  if (/bankrupt|foreclos|eviction/.test(notes + " " + credit)) {
    risks.push("possible lending / credit complication");
  }
  if (/guarantee|approved|pre.?approved/.test(notes)) {
    risks.push("buyer expects guaranteed approval");
  }

  const status =
    score >= 9 ? "Hot" : score >= 7 ? "Warm" : score >= 4 ? "Developing" : score >= 1 ? "Cold" : "Dead";

  const escalation = risks.some((r) => /lending|credit|compliance/.test(r))
    ? "ESCALATE TO PROFESSIONAL"
    : "NONE";

  const followupWindow =
    status === "Hot" ? "1h" : status === "Warm" ? "24h" : "3d";

  const nextAction =
    status === "Hot"
      ? "Attempt live contact now"
      : missing.length > 0
      ? `Ask about: ${missing.slice(0, 2).join(", ")}`
      : "Send follow-up message";

  return {
    leadId: lead.leadId,
    leadType: "buyer",
    status,
    score: Math.min(10, score),
    knownFacts: known,
    missingFacts: missing,
    riskFlags: risks,
    nextAction,
    followupWindow,
    suggestedScript: buildBuyerScript(lead, missing),
    escalation,
  };
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^0-9.\-]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function buildBuyerScript(lead: BuyerLead, missing: string[]): string {
  const firstName = safeString(lead.name).split(/\s+/)[0] || "there";
  const ask = missing[0];
  const askLine = ask ? ` Quick question — ${buyerQuestion(ask)}` : "";
  return `Hi ${firstName}, thanks for reaching out about homes in ${lead.targetArea || "your area"}.${askLine} We work with owners directly so sometimes there are options outside the bank route.`;
}

function buyerQuestion(field: string): string {
  switch (field) {
    case "down payment":
      return "roughly how much do you have available for a down payment?";
    case "target area":
      return "what neighborhoods or areas are you focused on?";
    case "budget":
      return "what price range fits you?";
    case "timeline":
      return "how soon are you hoping to move?";
    case "monthly income":
      return "roughly what does your monthly income look like?";
    default:
      return `can you share your ${field}?`;
  }
}
