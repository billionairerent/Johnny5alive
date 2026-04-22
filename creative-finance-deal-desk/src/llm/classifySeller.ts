import { SellerLead } from "../types/seller";
import { ScoredLead } from "../types/scoredLead";
import { renderPrompt, loadPrompt } from "../lib/promptLoader";
import { validate } from "../lib/schemaValidator";
import { getLLMClient, extractJson, StubLLMClient } from "./client";
import { logger } from "../lib/logger";
import { safeString } from "../lib/textUtils";

/**
 * Classify a seller lead.
 * Tries the injected LLM first. If the response fails validation or the
 * default stub client is in use, falls back to a deterministic heuristic
 * scorer so the workflow stays functional.
 */
export async function classifySeller(lead: SellerLead): Promise<ScoredLead> {
  const client = getLLMClient();

  if (!(client instanceof StubLLMClient)) {
    try {
      const system = loadPrompt("core_system_prompt");
      const user = renderPrompt("classify_seller", { sellerLead: lead });
      const res = await client.complete({ system, user, json: true });
      const parsed = extractJson(res.text) as Partial<ScoredLead>;
      const candidate: ScoredLead = {
        leadId: lead.leadId,
        leadType: "seller",
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
      logger.warn("LLM seller classification failed schema; falling back", { errors });
    } catch (err) {
      logger.warn("LLM seller classification threw; falling back", {
        error: (err as Error).message,
      });
    }
  }

  return heuristicSellerScore(lead);
}

/**
 * Deterministic heuristic scorer. No LLM required.
 * Uses weights described in skills/lead_scoring.md.
 */
export function heuristicSellerScore(lead: SellerLead): ScoredLead {
  const known: string[] = [];
  const missing: string[] = [];
  const risks: string[] = [];
  let score = 0;

  // motivation 0-3 (timeline signal)
  const timeline = safeString(lead.timeline).toLowerCase();
  if (/asap|immediately|30|month/.test(timeline)) {
    score += 3;
    known.push("motivated timeline");
  } else if (/3.?months|60|90/.test(timeline)) {
    score += 2;
    known.push("near-term timeline");
  } else if (timeline) {
    score += 1;
    known.push(`timeline: ${lead.timeline}`);
  } else {
    missing.push("timeline");
  }

  // flexibility 0-3
  const flex = safeString(lead.flexibleTermsInterest).toLowerCase();
  if (/yes|open|willing|interested/.test(flex)) {
    score += 3;
    known.push("open to flexible terms");
  } else if (/maybe|depends|consider/.test(flex)) {
    score += 2;
    known.push("maybe flexible");
  } else if (/no|not|refuse/.test(flex)) {
    risks.push("inflexible seller");
  } else {
    missing.push("flexibility");
  }

  // data completeness 0-2
  if (lead.askingPrice !== undefined && lead.askingPrice !== "") {
    score += 1;
    known.push(`asking price ${lead.askingPrice}`);
  } else {
    missing.push("asking price");
  }
  if (lead.mortgageBalance !== undefined && lead.mortgageBalance !== null && lead.mortgageBalance !== "") {
    score += 1;
    known.push(`mortgage balance ${lead.mortgageBalance}`);
  } else {
    missing.push("mortgage balance");
  }

  // occupancy / condition signals 0-2
  const occ = safeString(lead.occupancy).toLowerCase();
  if (occ) {
    score += 1;
    known.push(`occupancy: ${lead.occupancy}`);
    if (/vacant/.test(occ)) score += 1;
  } else {
    missing.push("occupancy");
  }

  // risk scan
  const notes = safeString(lead.notes).toLowerCase();
  if (/foreclos|bankrupt|lien|title|probate|inherit/.test(notes)) {
    risks.push("possible legal / title complication");
  }

  const status =
    score >= 9 ? "Hot" : score >= 7 ? "Warm" : score >= 4 ? "Developing" : score >= 1 ? "Cold" : "Dead";

  const escalation = risks.some((r) => /legal|title/.test(r))
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
    leadType: "seller",
    status,
    score: Math.min(10, score),
    knownFacts: known,
    missingFacts: missing,
    riskFlags: risks,
    nextAction,
    followupWindow,
    suggestedScript: buildSellerScript(lead, missing),
    escalation,
  };
}

function buildSellerScript(lead: SellerLead, missing: string[]): string {
  const firstName = safeString(lead.name).split(/\s+/)[0] || "there";
  const ask = missing[0];
  const askLine = ask ? ` Quick question — ${sellerQuestion(ask)}` : "";
  return `Hi ${firstName}, following up on the property at ${lead.propertyAddress}.${askLine} Happy to work around your timeline.`;
}

function sellerQuestion(field: string): string {
  switch (field) {
    case "asking price":
      return "what price were you hoping for?";
    case "mortgage balance":
      return "is there still a loan on the property, and roughly how much?";
    case "timeline":
      return "how soon are you trying to sell?";
    case "flexibility":
      return "would you consider flexible terms if the right buyer came along?";
    case "occupancy":
      return "is the place occupied right now or vacant?";
    default:
      return `can you share your ${field}?`;
  }
}
