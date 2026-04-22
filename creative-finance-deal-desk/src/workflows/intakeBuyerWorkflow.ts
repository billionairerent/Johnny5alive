import { BuyerLead } from "../types/buyer";
import { FollowupTask } from "../types/followupTask";
import { normalizeBuyerPayload, generateId, safeString } from "../lib/textUtils";
import { nowIso, addDaysIso, addHoursIso } from "../lib/dateUtils";
import { validate } from "../lib/schemaValidator";
import { classifyBuyer } from "../llm/classifyBuyer";
import {
  createBuyerLead,
  updateBuyerLead,
  createFollowupTask,
} from "../adapters/airtableAdapter";
import { config } from "../config";
import { logger } from "../lib/logger";

export interface IntakeBuyerResult {
  success: boolean;
  workflow: "intakeBuyerWorkflow";
  leadId?: string;
  status?: string;
  score?: number;
  followupCreated?: boolean;
  escalation?: string;
  error?: string;
  details?: string[];
}

export async function intakeBuyerWorkflow(
  payload: Record<string, unknown>
): Promise<IntakeBuyerResult> {
  try {
    const normalized = normalizeBuyerPayload(payload);
    const lead = coerceBuyerLead(normalized);

    const { valid, errors } = validate("buyerLead", lead);
    if (!valid) {
      return {
        success: false,
        workflow: "intakeBuyerWorkflow",
        error: "Schema validation failed",
        details: errors,
      };
    }

    await createBuyerLead(lead);

    const scored = await classifyBuyer(lead);
    await updateBuyerLead(lead.leadId, {
      status: scored.status,
      score: scored.score,
      riskFlags: scored.riskFlags,
      escalation: scored.escalation,
    });

    const followup: FollowupTask = {
      taskId: generateId("task"),
      leadId: lead.leadId,
      leadType: "buyer",
      dueAt: computeDueAt(scored.followupWindow),
      channel: "sms",
      status: "pending",
      message: scored.suggestedScript,
      assignedAgent: lead.assignedAgent ?? null,
      createdAt: nowIso(),
    };
    await createFollowupTask(followup);

    if (scored.score >= config.thresholds.hotLeadScore) {
      logger.info("strong buyer lead alert", {
        leadId: lead.leadId,
        score: scored.score,
      });
    }

    return {
      success: true,
      workflow: "intakeBuyerWorkflow",
      leadId: lead.leadId,
      status: scored.status,
      score: scored.score,
      followupCreated: true,
      escalation: scored.escalation,
    };
  } catch (err) {
    logger.error("intakeBuyerWorkflow error", { error: (err as Error).message });
    return {
      success: false,
      workflow: "intakeBuyerWorkflow",
      error: (err as Error).message,
    };
  }
}

function coerceBuyerLead(src: Record<string, unknown>): BuyerLead {
  return {
    leadId: safeString(src.leadId, generateId("buyer")),
    createdAt: safeString(src.createdAt, nowIso()),
    name: safeString(src.name),
    phone: safeString(src.phone),
    email: typeof src.email === "string" ? src.email : undefined,
    targetArea: safeString(src.targetArea),
    budget: (src.budget as number | string) ?? "",
    downPayment: (src.downPayment as number | string) ?? "",
    monthlyIncome: (src.monthlyIncome as number | string | null | undefined) ?? null,
    creditSituation: (src.creditSituation as string | null | undefined) ?? null,
    selfEmployed: (src.selfEmployed as boolean | string | null | undefined) ?? null,
    timeline: safeString(src.timeline),
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
