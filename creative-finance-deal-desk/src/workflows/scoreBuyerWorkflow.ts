import { BuyerLead } from "../types/buyer";
import { classifyBuyer } from "../llm/classifyBuyer";
import { updateBuyerLead } from "../adapters/airtableAdapter";
import { ScoredLead } from "../types/scoredLead";
import { logger } from "../lib/logger";

export interface ScoreBuyerResult {
  success: boolean;
  workflow: "scoreBuyerWorkflow";
  scored?: ScoredLead;
  error?: string;
}

export async function scoreBuyerWorkflow(
  lead: BuyerLead
): Promise<ScoreBuyerResult> {
  try {
    const scored = await classifyBuyer(lead);
    await updateBuyerLead(lead.leadId, {
      status: scored.status,
      score: scored.score,
      riskFlags: scored.riskFlags,
      escalation: scored.escalation,
    });
    return { success: true, workflow: "scoreBuyerWorkflow", scored };
  } catch (err) {
    logger.error("scoreBuyerWorkflow error", { error: (err as Error).message });
    return {
      success: false,
      workflow: "scoreBuyerWorkflow",
      error: (err as Error).message,
    };
  }
}
