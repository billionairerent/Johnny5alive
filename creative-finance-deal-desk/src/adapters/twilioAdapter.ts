import { logger } from "../lib/logger";
import { config } from "../config";

/**
 * Twilio adapter stub. Wire to the real Twilio SDK in production.
 * For now this logs the outbound SMS so workflows are observable in dev.
 */

export interface SmsResult {
  success: boolean;
  sid?: string;
  error?: string;
}

export type SmsSender = (to: string, body: string) => Promise<SmsResult>;

let sender: SmsSender = async (to, body) => {
  logger.info("twilio.sendSMS (stub)", {
    to,
    from: config.twilio.phoneNumber,
    bodyPreview: body.slice(0, 80),
  });
  return { success: true, sid: `stub_${Date.now()}` };
};

export function setSmsSender(impl: SmsSender): void {
  sender = impl;
}

export async function sendSMS(to: string, body: string): Promise<SmsResult> {
  if (!to) return { success: false, error: "Missing recipient" };
  if (!body) return { success: false, error: "Missing body" };
  return sender(to, body);
}
