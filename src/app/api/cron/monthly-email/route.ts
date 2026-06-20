import { NextRequest, NextResponse } from "next/server";
import { getMonthlyReport, previousMonthKey } from "@/lib/monthly-report";
import { renderMonthlyEmail } from "@/lib/email-report";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Validates the Bearer token Vercel Cron injects (and that manual callers must supply). */
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const month = monthParam && MONTH_KEY_RE.test(monthParam) ? monthParam : previousMonthKey();
  const dryRun = searchParams.get("dryRun") === "1";

  try {
    const report = await getMonthlyReport(month);
    const { subject, html } = renderMonthlyEmail(report);

    if (dryRun) {
      // Return the rendered email so it can be previewed in a browser.
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const result = await sendEmail({ subject, html });
    return NextResponse.json({
      ok: true,
      month,
      subject,
      sentTo: result.to,
      messageId: result.id,
    });
  } catch (error) {
    console.error("Monthly email cron error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, month, error: message }, { status: 500 });
  }
}
