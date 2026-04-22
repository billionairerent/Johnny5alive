import {
  findLeadsDueForFollowup,
  getSellerById,
  getBuyerById,
} from "../adapters/airtableAdapter";
import { sendSMS } from "../adapters/twilioAdapter";
import { sendEmail } from "../adapters/gmailAdapter";
import { addDaysIso, nowIso } from "../lib/dateUtils";
import { FollowupTask } from "../types/followupTask";
import { logger } from "../lib/logger";

export interface DailyFollowupResult {
  success: boolean;
  workflow: "dailyFollowupWorkflow";
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Scan for follow-up tasks that are due now and dispatch them.
 * Each task is advanced to the next touch window on success.
 */
export async function dailyFollowupWorkflow(): Promise<DailyFollowupResult> {
  const due = await findLeadsDueForFollowup();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const task of due) {
    try {
      const contact = await resolveContact(task);
      if (!contact) {
        failed += 1;
        errors.push(`No contact for lead ${task.leadId}`);
        continue;
      }

      const delivered = await dispatch(task, contact);
      if (delivered) {
        sent += 1;
      } else {
        failed += 1;
      }
    } catch (err) {
      failed += 1;
      errors.push(`${task.taskId}: ${(err as Error).message}`);
    }
  }

  logger.info("dailyFollowupWorkflow done", {
    processed: due.length,
    sent,
    failed,
  });

  return {
    success: true,
    workflow: "dailyFollowupWorkflow",
    processed: due.length,
    sent,
    failed,
    errors,
  };
}

interface ResolvedContact {
  phone?: string;
  email?: string | null;
  firstName: string;
}

async function resolveContact(task: FollowupTask): Promise<ResolvedContact | null> {
  if (task.leadType === "seller") {
    const s = await getSellerById(task.leadId);
    if (!s) return null;
    return {
      phone: s.phone,
      email: s.email,
      firstName: (s.name || "").split(/\s+/)[0] || "there",
    };
  }
  const b = await getBuyerById(task.leadId);
  if (!b) return null;
  return {
    phone: b.phone,
    email: b.email,
    firstName: (b.name || "").split(/\s+/)[0] || "there",
  };
}

async function dispatch(task: FollowupTask, contact: ResolvedContact): Promise<boolean> {
  if (task.channel === "sms" && contact.phone) {
    const result = await sendSMS(contact.phone, task.message);
    return result.success;
  }
  if (task.channel === "email" && contact.email) {
    const result = await sendEmail(contact.email, "Quick note", task.message);
    return result.success;
  }
  // call-channel tasks are logged for agent pickup; no auto-dispatch
  logger.info("call-channel follow-up queued for agent", {
    taskId: task.taskId,
    leadId: task.leadId,
  });
  return true;
}

/**
 * Helper to advance a task forward by N days. Workflows / agents can call
 * this after handling a task.
 */
export function nextTouch(task: FollowupTask, inDays = 3): FollowupTask {
  return { ...task, dueAt: addDaysIso(inDays), createdAt: task.createdAt ?? nowIso() };
}
