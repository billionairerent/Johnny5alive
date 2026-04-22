import { SellerLead } from "../types/seller";
import { FollowupTask } from "../types/followupTask";
import { normalizeSellerPayload, generateId, safeString } from "../lib/textUtils";
import { nowIso, addDaysIso, addHoursIso } from "../lib/dateUtils";
import { validate } from "../lib/schemaValidator";
import { classifySeller } from "../llm/classifySeller";
import {
  createSellerLead,
  updateSellerLead,
  createFollowupTask,
} from "../adapters/airtableAdapter";
import { config } from "../config";
import { logger } from "../lib/logger";

export interface IntakeSellerResult {
  success: boolean;
  workflow: "intakeSellerWorkflow";
  leadId?: string;
  status?: string;
  score?: number;
  followupCreated?: boolean;
  escalation?: string;
  error?: string;
  details?: string[];
}

/**
 * Intake workflow for seller leads.
 * Contract: always returns a predictable JSON envelope.
 */
export async function intakeSellerWorkflow(
  payload: Record<string, unknown>
): Promise<IntakeSellerResult> {
  try {
    const normalized = normalizeSellerPayload(payload);
    const lead = coerceSellerLead(normalized);

    const { valid, errors } = validate("sellerLead", lead);
    if (!valid) {
      return {
        success: false,
        workflow: "intakeSellerWorkflow",
        error: "Schema validation failed",
        details: errors,
      };
    }

    await createSellerLead(lead);

    const scored = await classifySeller(lead);
    await updateSellerLead(lead.leadId, {
      status: scored.status,
      score: scored.score,
      riskFlags: scored.riskFlags,
      escalation: scored.escalation,
    });

    const followup: FollowupTask = {
      taskId: generateId("task"),
      leadId: lead.leadId,
      leadType: "seller",
      dueAt: computeDueAt(scored.followupWindow),
      channel: "sms",
      status: "pending",
      message: scored.suggestedScript,
      assignedAgent: lead.assignedAgent ?? null,
      createdAt: nowIso(),
    };
    await createFollowupTask(followup);

    if (scored.score >= config.thresholds.hotLeadScore) {
      logger.info("hot seller lead alert", {
        leadId: lead.leadId,
        score: scored.score,
      });
    }

    return {
      success: true,
      workflow: "intakeSellerWorkflow",
      leadId: lead.leadId,
      status: scored.status,
      score: scored.score,
      followupCreated: true,
      escalation: scored.escalation,
    };
  } catch (err) {
    logger.error("intakeSellerWorkflow error", { error: (err as Error).message });
    return {
      success: false,
      workflow: "intakeSellerWorkflow",
      error: (err as Error).message,
    };
  }
}

function coerceSellerLead(src: Record<string, unknown>): SellerLead {
  return {
    leadId: safeString(src.leadId, generateId("seller")),
    createdAt: safeString(src.createdAt, nowIso()),
    name: safeString(src.name),
    phone: safeString(src.phone),
    email: typeof src.email === "string" ? src.email : undefined,
    propertyAddress: safeString(src.propertyAddress),
    askingPrice: (src.askingPrice as number | string) ?? "",
    mortgageBalance: (src.mortgageBalance as number | string | null | undefined) ?? null,
    monthlyPayment: (src.monthlyPayment as number | string | null | undefined) ?? null,
    occupancy: (src.occupancy as string | null | undefined) ?? null,
    condition: (src.condition as string | null | undefined) ?? null,
    timeline: safeString(src.timeline),
    flexibleTermsInterest: safeString(src.flexibleTermsInterest),
    leadSource: (src.leadSource as string | null | undefined) ?? null,
    assignedAgent: (src.assignedAgent as string | null | undefined) ?? null,
    notes: safeString(src.notes),
  };
}

function computeDueAt(window: string): string {
  const w = window.toLowerCase();
  if (w.includes("1h")) return addHoursIso(1);
  if (w.includes("24h") || w.includes("1d")) return addDaysIso(1);
  if (w.includes("3d")) return addDaysIso(3);
  if (w.includes("7d")) return addDaysIso(7);
  return addDaysIso(1);
}
