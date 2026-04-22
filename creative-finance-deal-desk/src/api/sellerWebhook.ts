import { wrapWebhook } from "../adapters/webhookAdapter";
import {
  intakeSellerWorkflow,
  IntakeSellerResult,
} from "../workflows/intakeSellerWorkflow";

/**
 * Framework-agnostic webhook handler for seller intake.
 * Pass the raw JSON body of the incoming request.
 */
export async function sellerWebhook(
  body: unknown,
  source = "unknown"
): Promise<IntakeSellerResult> {
  const data =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const envelope = wrapWebhook(source, data, "seller.lead.created");
  return intakeSellerWorkflow(envelope.data);
}
