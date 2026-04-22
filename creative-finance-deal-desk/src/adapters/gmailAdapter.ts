import { logger } from "../lib/logger";
import { config } from "../config";

/**
 * Gmail adapter stub. Wire to nodemailer or the Gmail API in production.
 */

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type EmailSender = (
  to: string,
  subject: string,
  body: string
) => Promise<EmailResult>;

let sender: EmailSender = async (to, subject, body) => {
  logger.info("gmail.sendEmail (stub)", {
    to,
    from: config.gmail.user,
    subject,
    bodyPreview: body.slice(0, 120),
  });
  return { success: true, messageId: `stub_${Date.now()}` };
};

export function setEmailSender(impl: EmailSender): void {
  sender = impl;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<EmailResult> {
  if (!to) return { success: false, error: "Missing recipient" };
  if (!subject) return { success: false, error: "Missing subject" };
  if (!body) return { success: false, error: "Missing body" };
  return sender(to, subject, body);
}
