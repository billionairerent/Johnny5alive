import {
  dailyFollowupWorkflow,
  DailyFollowupResult,
} from "../workflows/dailyFollowupWorkflow";

/**
 * Webhook handler to run the daily follow-up sweep. Typically triggered by a
 * cron job or scheduler (Airtable automation, Cloudflare cron, etc).
 */
export async function followupWebhook(): Promise<DailyFollowupResult> {
  return dailyFollowupWorkflow();
}
