import { Resend } from "resend";

const DEFAULT_FROM = "X Wealth <onboarding@resend.dev>";
const DEFAULT_TO = "fanzhangxuan@outlook.com";

export interface SendEmailInput {
  subject: string;
  html: string;
  /** Overrides REPORT_EMAIL_TO. Accepts a single address, comma-separated list, or array. */
  to?: string | string[];
}

export interface SendEmailResult {
  id: string;
  to: string[];
}

function parseRecipients(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean);
  const raw = value ?? process.env.REPORT_EMAIL_TO ?? DEFAULT_TO;
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Sends an HTML email via Resend. Throws with a clear message if misconfigured. */
export async function sendEmail({ subject, html, to }: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set — cannot send email.");
  }

  const recipients = parseRecipients(to);
  if (recipients.length === 0) {
    throw new Error("No email recipients configured (REPORT_EMAIL_TO is empty).");
  }

  const from = process.env.REPORT_EMAIL_FROM || DEFAULT_FROM;
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: recipients,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend failed to send email: ${error.message}`);
  }

  return { id: data?.id ?? "", to: recipients };
}
