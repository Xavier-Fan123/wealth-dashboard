import { prisma } from "@/lib/prisma";
import { convertToSGD } from "@/lib/market";
import { getDashboardData, formatMonthLabel, type DashboardSnapshot } from "@/lib/dashboard-data";

export interface MonthlyTransaction {
  id: string;
  date: string;
  entity: string;
  asset: string;
  currency: string;
  amount: number;
  units: number | null;
  price: number | null;
  type: string;
  note: string | null;
  amountSGD: number;
}

export interface MonthlyReport {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g. "May 25"
  generatedAt: string;
  snapshot: DashboardSnapshot;
  /** All capital-flow transactions dated within the target month (asc by date). */
  transactions: MonthlyTransaction[];
  /** COMPANY DEPOSIT rows — external cash injections / revenue. */
  companyIncome: MonthlyTransaction[];
  /** COMPANY WITHDRAW rows — cash outflow / expenses (same basis as burn rate). */
  companyExpenses: MonthlyTransaction[];
  /** BUY / SELL / TRANSFER rows across both entities — investment & movement actions. */
  operations: MonthlyTransaction[];
  companyIncomeTotalSGD: number;
  companyExpenseTotalSGD: number;
  companyNetSGD: number;
}

/** Returns the YYYY-MM key for the calendar month immediately before `ref`. */
export function previousMonthKey(ref: Date = new Date()): string {
  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth(); // 0-based; subtracting 1 and normalizing handles Jan→Dec
  const prev = new Date(Date.UTC(year, month - 1, 1));
  return prev.toISOString().slice(0, 7);
}

function monthRange(monthKey: string): { start: Date; end: Date } {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1)); // exclusive upper bound
  return { start, end };
}

/**
 * Builds the data for the monthly email: a fresh asset snapshot (reusing the exact
 * dashboard aggregation) plus every transaction dated within `monthKey`, classified by
 * the project's business rules (see CLAUDE.md):
 *   - COMPANY DEPOSIT  → income
 *   - COMPANY WITHDRAW → expense (matches the burn-rate basis)
 *   - BUY / SELL / TRANSFER → operations
 */
export async function getMonthlyReport(
  monthKey: string = previousMonthKey()
): Promise<MonthlyReport> {
  const { start, end } = monthRange(monthKey);

  const [snapshot, rawTransactions] = await Promise.all([
    getDashboardData(),
    prisma.transaction.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
  ]);

  const fxRates = snapshot.fxRates;

  const transactions: MonthlyTransaction[] = rawTransactions.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    entity: t.entity,
    asset: t.asset,
    currency: t.currency,
    amount: t.amount,
    units: t.units,
    price: t.price,
    type: t.type,
    note: t.note,
    amountSGD: convertToSGD(Math.abs(t.amount), t.currency, fxRates),
  }));

  const companyIncome = transactions.filter(
    (t) => t.entity === "COMPANY" && t.type === "DEPOSIT"
  );
  const companyExpenses = transactions.filter(
    (t) => t.entity === "COMPANY" && t.type === "WITHDRAW"
  );
  const operations = transactions.filter((t) =>
    ["BUY", "SELL", "TRANSFER"].includes(t.type)
  );

  const companyIncomeTotalSGD = companyIncome.reduce((sum, t) => sum + t.amountSGD, 0);
  const companyExpenseTotalSGD = companyExpenses.reduce((sum, t) => sum + t.amountSGD, 0);

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    generatedAt: new Date().toISOString(),
    snapshot,
    transactions,
    companyIncome,
    companyExpenses,
    operations,
    companyIncomeTotalSGD: Math.round(companyIncomeTotalSGD),
    companyExpenseTotalSGD: Math.round(companyExpenseTotalSGD),
    companyNetSGD: Math.round(companyIncomeTotalSGD - companyExpenseTotalSGD),
  };
}
