import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { MonthlyReport, MonthlyTransaction } from "@/lib/monthly-report";

// Dark theme palette mirroring globals.css so the email matches the dashboard.
const C = {
  bg: "#09090b",
  card: "#18181b",
  border: "#27272a",
  text: "#fafafa",
  muted: "#a1a1aa",
  primary: "#6366f1",
  success: "#22c55e",
  warning: "#f59e0b",
  info: "#3b82f6",
  destructive: "#ef4444",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sgd(value: number): string {
  return formatCurrency(value);
}

function plColor(value: number): string {
  return value >= 0 ? C.success : C.destructive;
}

function kpiCard(title: string, value: string, accent: string): string {
  return `
    <td style="padding:6px;" width="50%" valign="top">
      <div style="background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:16px;">
        <div style="color:${C.muted};font-size:12px;text-transform:uppercase;letter-spacing:.04em;">${escapeHtml(title)}</div>
        <div style="color:${accent};font-size:22px;font-weight:700;margin-top:6px;">${escapeHtml(value)}</div>
      </div>
    </td>`;
}

function sectionTitle(text: string): string {
  return `<h2 style="color:${C.text};font-size:16px;font-weight:600;margin:28px 0 12px;border-left:3px solid ${C.primary};padding-left:10px;">${escapeHtml(text)}</h2>`;
}

function th(text: string, align: "left" | "right" = "left"): string {
  return `<th align="${align}" style="color:${C.muted};font-size:11px;text-transform:uppercase;letter-spacing:.04em;font-weight:600;padding:8px 10px;border-bottom:1px solid ${C.border};">${escapeHtml(text)}</th>`;
}

function td(html: string, align: "left" | "right" = "left", color = C.text): string {
  return `<td align="${align}" style="color:${color};font-size:13px;padding:8px 10px;border-bottom:1px solid ${C.border};">${html}</td>`;
}

function tableWrap(headerCells: string, bodyRows: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.card};border:1px solid ${C.border};border-radius:12px;border-collapse:separate;overflow:hidden;">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>`;
}

function emptyRow(colSpan: number, text: string): string {
  return `<tr><td colspan="${colSpan}" style="color:${C.muted};font-size:13px;padding:14px 10px;text-align:center;">${escapeHtml(text)}</td></tr>`;
}

// --- Section builders -------------------------------------------------------

function overviewSection(report: MonthlyReport): string {
  const s = report.snapshot;
  const runway = s.cashRunway != null ? `${s.cashRunway} months` : "N/A";
  return (
    sectionTitle("资产总览 · Overview") +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
    kpiCard("Total Net Worth", sgd(s.totalNetWorth), C.primary) +
    kpiCard("Family Net Worth", sgd(s.familyNetWorth), C.success) +
    `</tr><tr>` +
    kpiCard("Company Liquidity", sgd(s.companyLiquidity), C.info) +
    kpiCard("Cash Runway", runway, C.warning) +
    `</tr></table>`
  );
}

function familyPortfolioSection(report: MonthlyReport): string {
  const s = report.snapshot;
  const familyHoldings = s.holdings.filter((h) => h.entity === "FAMILY");
  const familyCash = s.manualAssets.filter((a) => a.entity === "FAMILY");

  const holdingRows =
    familyHoldings.length > 0
      ? familyHoldings
          .map(
            (h) =>
              `<tr>` +
              td(`<strong>${escapeHtml(h.ticker)}</strong>`) +
              td(formatNumber(h.shares, 2), "right", C.muted) +
              td(sgd(h.marketValueSGD), "right") +
              td(
                `${formatPercent(h.unrealizedPLPercent)}`,
                "right",
                plColor(h.unrealizedPL)
              ) +
              `</tr>`
          )
          .join("")
      : emptyRow(4, "No family holdings");

  const cashRows =
    familyCash.length > 0
      ? familyCash
          .map(
            (a) =>
              `<tr>` +
              td(escapeHtml(a.name)) +
              td(escapeHtml(a.currency), "right", C.muted) +
              td(sgd(a.valueSGD), "right") +
              `</tr>`
          )
          .join("")
      : emptyRow(3, "No family cash accounts");

  return (
    sectionTitle("家庭投资组合 · Family Portfolio") +
    tableWrap(
      th("Asset") + th("Shares", "right") + th("Value (SGD)", "right") + th("Unrealized", "right"),
      holdingRows
    ) +
    `<div style="height:10px;"></div>` +
    tableWrap(th("Cash Account") + th("Ccy", "right") + th("Value (SGD)", "right"), cashRows)
  );
}

function companySection(report: MonthlyReport): string {
  const s = report.snapshot;
  const company = s.balanceSheet.company;
  const rows = company.assets
    .filter((line) => line.value !== 0)
    .map(
      (line) =>
        `<tr>` + td(escapeHtml(line.name)) + td(sgd(line.value), "right") + `</tr>`
    )
    .join("");

  const statRows =
    `<tr>` +
    td("Avg Monthly Burn") +
    td(sgd(s.avgMonthlyBurn), "right", C.warning) +
    `</tr>` +
    `<tr>` +
    td("Cash Runway") +
    td(s.cashRunway != null ? `${s.cashRunway} months` : "N/A", "right") +
    `</tr>` +
    `<tr>` +
    td("Company Net Worth") +
    td(sgd(s.companyNetWorth), "right", C.success) +
    `</tr>`;

  return (
    sectionTitle("公司资产与现金 · Company") +
    tableWrap(
      th("Company Assets") + th("Value (SGD)", "right"),
      rows || emptyRow(2, "No company assets")
    ) +
    `<div style="height:10px;"></div>` +
    tableWrap(th("Metric") + th("Value", "right"), statRows)
  );
}

function txRow(t: MonthlyTransaction, accent?: string): string {
  const date = t.date.slice(0, 10);
  const detail =
    t.units && t.price
      ? `${formatNumber(t.units, 2)} @ ${formatNumber(t.price, 2)} ${escapeHtml(t.currency)}`
      : escapeHtml(t.note ?? "");
  return (
    `<tr>` +
    td(date, "left", C.muted) +
    td(escapeHtml(t.entity), "left", C.muted) +
    td(`<strong>${escapeHtml(t.type)}</strong>`, "left", accent ?? C.text) +
    td(escapeHtml(t.asset)) +
    td(detail, "left", C.muted) +
    td(sgd(t.amountSGD), "right") +
    `</tr>`
  );
}

function activitySection(report: MonthlyReport): string {
  const header =
    th("Date") + th("Entity") + th("Type") + th("Asset") + th("Detail") + th("Amount (SGD)", "right");

  const opsRows =
    report.operations.length > 0
      ? report.operations.map((t) => txRow(t)).join("")
      : emptyRow(6, "No investment operations this month");

  const incomeRows =
    report.companyIncome.length > 0
      ? report.companyIncome.map((t) => txRow(t, C.success)).join("")
      : emptyRow(6, "No company income this month");

  const expenseRows =
    report.companyExpenses.length > 0
      ? report.companyExpenses.map((t) => txRow(t, C.destructive)).join("")
      : emptyRow(6, "No company expenses this month");

  const summary = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr>
      ${kpiCard("公司收入 Income", sgd(report.companyIncomeTotalSGD), C.success)}
      ${kpiCard("公司支出 Expenses", sgd(report.companyExpenseTotalSGD), C.destructive)}
    </tr><tr>
      ${kpiCard("公司净额 Net", sgd(report.companyNetSGD), plColor(report.companyNetSGD))}
      ${kpiCard("本月交易笔数 Count", String(report.transactions.length), C.info)}
    </tr></table>`;

  return (
    sectionTitle("本月操作与收支 · This Month's Activity") +
    `<div style="color:${C.muted};font-size:13px;margin-bottom:8px;">投资操作 (BUY / SELL / TRANSFER)</div>` +
    tableWrap(header, opsRows) +
    `<div style="color:${C.muted};font-size:13px;margin:14px 0 8px;">公司收入 (DEPOSIT)</div>` +
    tableWrap(header, incomeRows) +
    `<div style="color:${C.muted};font-size:13px;margin:14px 0 8px;">公司支出 (WITHDRAW)</div>` +
    tableWrap(header, expenseRows) +
    summary
  );
}

// --- Public API -------------------------------------------------------------

export function renderMonthlyEmail(report: MonthlyReport): { subject: string; html: string } {
  const subject = `X Wealth · ${report.monthLabel} 月度资产报告`;
  const generated = report.generatedAt.slice(0, 10);
  const fx = report.snapshot.fxRates;

  const body =
    overviewSection(report) +
    familyPortfolioSection(report) +
    companySection(report) +
    activitySection(report);

  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="padding:0 16px;">
          <div style="color:${C.text};font-size:22px;font-weight:700;">X Wealth Dashboard</div>
          <div style="color:${C.muted};font-size:13px;margin-top:4px;">
            ${escapeHtml(report.monthLabel)} 月度报告 · 生成于 ${escapeHtml(generated)} · 以 SGD 计价
          </div>
          <div style="color:${C.muted};font-size:12px;margin-top:2px;">
            FX: USD/SGD ${formatNumber(fx.USDSGD, 4)} · CNY/SGD ${formatNumber(fx.CNYSGD, 4)}
          </div>
          ${body}
          <div style="color:${C.muted};font-size:11px;margin-top:28px;border-top:1px solid ${C.border};padding-top:14px;">
            本邮件由 wealth-dashboard 自动生成。数据来源于实时行情与汇率，仅供内部参考。
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
