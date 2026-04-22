import { wrapWebhook } from "../adapters/webhookAdapter";
import {
  intakeBuyerWorkflow,
  IntakeBuyerResult,
} from "../workflows/intakeBuyerWorkflow";

export async function buyerWebhook(
  body: unknown,
  source = "unknown"
): Promise<IntakeBuyerResult> {
  const data =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const envelope = wrapWebhook(source, data, "buyer.lead.created");
  return intakeBuyerWorkflow(envelope.data);
}
