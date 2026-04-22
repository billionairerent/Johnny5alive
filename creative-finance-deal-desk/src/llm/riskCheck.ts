import { renderPrompt, loadPrompt } from "../lib/promptLoader";
import { getLLMClient, extractJson, StubLLMClient } from "./client";
import { logger } from "../lib/logger";
import { safeString } from "../lib/textUtils";

export type Escalation = "NONE" | "REVIEW" | "ESCALATE TO PROFESSIONAL";

export interface RiskResult {
  leadId: string;
  riskFlags: string[];
  escalation: Escalation;
  reason: string;
}

const RED_FLAG_PATTERNS: { re: RegExp; flag: string; escalate: boolean }[] = [
  { re: /foreclos/i, flag: "foreclosure", escalate: true },
  { re: /bankrupt/i, flag: "bankruptcy", escalate: true },
  { re: /lien|title/i, flag: "title or lien concern", escalate: true },
  { re: /due.on.sale/i, flag: "due-on-sale concern", escalate: true },
  { re: /probate|inherit/i, flag: "probate / inheritance", escalate: true },
  { re: /hide|conceal/i, flag: "request to hide information", escalate: true },
  { re: /guarantee|pre.?approved|approved/i, flag: "promised approval language", escalate: false },
  { re: /minor|guardian|incapacit/i, flag: "capacity / guardianship", escalate: true },
  { re: /dodd.?frank|servicing|note creation/i, flag: "lending / servicing compliance", escalate: true },
];

/**
 * Run a lightweight risk pass on a lead-shaped object.
 * LLM-first when available, heuristic otherwise.
 */
export async function riskCheck(lead: {
  leadId: string;
  notes?: string | null;
  [key: string]: unknown;
}): Promise<RiskResult> {
  const client = getLLMClient();
  if (!(client instanceof StubLLMClient)) {
    try {
      const system = loadPrompt("core_system_prompt");
      const user = renderPrompt("risk_check", { lead });
      const res = await client.complete({ system, user, json: true });
      const parsed = extractJson(res.text) as Partial<RiskResult>;
      if (parsed.riskFlags || parsed.escalation) {
        return {
          leadId: lead.leadId,
          riskFlags: parsed.riskFlags ?? [],
          escalation: (parsed.escalation as Escalation) ?? "NONE",
          reason: safeString(parsed.reason, ""),
        };
      }
    } catch (err) {
      logger.warn("riskCheck LLM call failed; falling back", {
        error: (err as Error).message,
      });
    }
  }

  return heuristicRiskCheck(lead);
}

export function heuristicRiskCheck(lead: {
  leadId: string;
  notes?: string | null;
  [key: string]: unknown;
}): RiskResult {
  const blob = Object.values(lead)
    .map((v) => (typeof v === "string" ? v : ""))
    .join(" ");
  const flags: string[] = [];
  let shouldEscalate = false;
  for (const { re, flag, escalate } of RED_FLAG_PATTERNS) {
    if (re.test(blob)) {
      flags.push(flag);
      if (escalate) shouldEscalate = true;
    }
  }
  return {
    leadId: lead.leadId,
    riskFlags: flags,
    escalation: shouldEscalate ? "ESCALATE TO PROFESSIONAL" : flags.length ? "REVIEW" : "NONE",
    reason: flags.length ? `Matched: ${flags.join(", ")}` : "No risk patterns matched",
  };
}
