import { validate } from "../lib/schemaValidator";
import { logger } from "../lib/logger";
import { nowIso } from "../lib/dateUtils";

/**
 * Webhook adapter: validates and envelopes incoming payloads before they are
 * handed to the intake workflows. Keeps transport-specific parsing (Express,
 * Lambda, Vercel, etc.) out of the workflow layer.
 */

export interface WebhookEnvelope {
  source: string;
  receivedAt: string;
  eventType?: string | null;
  data: Record<string, unknown>;
}

export function wrapWebhook(
  source: string,
  data: Record<string, unknown>,
  eventType?: string
): WebhookEnvelope {
  const envelope: WebhookEnvelope = {
    source,
    receivedAt: nowIso(),
    eventType: eventType ?? null,
    data,
  };
  const result = validate("webhookPayload", envelope);
  if (!result.valid) {
    logger.warn("webhook envelope failed validation", { errors: result.errors });
  }
  return envelope;
}
