import { SellerLead } from "../types/seller";
import { classifySeller } from "../llm/classifySeller";
import { updateSellerLead } from "../adapters/airtableAdapter";
import { ScoredLead } from "../types/scoredLead";
import { logger } from "../lib/logger";

export interface ScoreSellerResult {
  success: boolean;
  workflow: "scoreSellerWorkflow";
  scored?: ScoredLead;
  error?: string;
}

/**
 * Re-score a seller lead and persist the update.
 */
export async function scoreSellerWorkflow(
  lead: SellerLead
): Promise<ScoreSellerResult> {
  try {
    const scored = await classifySeller(lead);
    await updateSellerLead(lead.leadId, {
      status: scored.status,
      score: scored.score,
      riskFlags: scored.riskFlags,
      escalation: scored.escalation,
    });
    return { success: true, workflow: "scoreSellerWorkflow", scored };
  } catch (err) {
    logger.error("scoreSellerWorkflow error", { error: (err as Error).message });
    return {
      success: false,
      workflow: "scoreSellerWorkflow",
      error: (err as Error).message,
    };
  }
}
