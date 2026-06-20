import nodemailer from "nodemailer";

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

/**
 * Sends an HTML email over SMTP (e.g. Gmail/Outlook with an app password).
 * Config via env: SMTP_HOST, SMTP_PORT (default 465), SMTP_USER, SMTP_PASS,
 * optional SMTP_SECURE ("true"/"false"; defaults to true on port 465).
 * Throws with a clear message if misconfigured.
 */
export async function sendEmail({ subject, html, to }: SendEmailInput): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured — set SMTP_HOST, SMTP_USER and SMTP_PASS.");
  }

  const port = Number(process.env.SMTP_PORT ?? 465);
  // Port 465 uses implicit TLS; 587/25 use STARTTLS. Allow an explicit override.
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;

  const recipients = parseRecipients(to);
  if (recipients.length === 0) {
    throw new Error("No email recipients configured (REPORT_EMAIL_TO is empty).");
  }

  // Most providers require the From address to match the authenticated user.
  const from = process.env.REPORT_EMAIL_FROM || user;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from,
    to: recipients,
    subject,
    html,
  });

  return { id: info.messageId ?? "", to: recipients };
}
