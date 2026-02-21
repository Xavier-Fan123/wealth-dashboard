import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuotes, getFxRates, convertToSGD } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [holdings, manualAssets, transactions, quotes, fxRates] = await Promise.all([
      prisma.holding.findMany(),
      prisma.manualAsset.findMany(),
      prisma.transaction.findMany({ orderBy: { date: "desc" } }),
      getQuotes(["VOO", "QQQ", "GLD"]),
      getFxRates(),
    ]);

    // Calculate family portfolio value
    let familyEquityValue = 0;
    let familyCommodityValue = 0;
    let familyCashValue = 0;
    let companyValue = 0;

    const holdingDetails = holdings.map((h) => {
      const quote = quotes[h.ticker];
      const currentPrice = quote?.price ?? 0;
      const marketValue = h.shares * currentPrice;
      const costBasis = h.shares * h.avgCost;
      const unrealizedPL = marketValue - costBasis;
      const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;
      const marketValueSGD = convertToSGD(marketValue, h.currency, fxRates);

      if (h.ticker === "GLD") {
        familyCommodityValue += marketValueSGD;
      } else {
        familyEquityValue += marketValueSGD;
      }

      return {
        ...h,
        currentPrice,
        marketValue,
        marketValueSGD,
        costBasis,
        unrealizedPL,
        unrealizedPLPercent,
        change: quote?.change ?? 0,
        changePercent: quote?.changePercent ?? 0,
      };
    });

    // Manual assets
    const manualAssetDetails = manualAssets.map((m) => {
      const valueSGD = convertToSGD(m.balance, m.currency, fxRates);
      if (m.category === "CASH_EQUIVALENT") {
        familyCashValue += valueSGD;
      } else if (m.category === "CORPORATE_CASH") {
        companyValue += valueSGD;
      }
      return { ...m, valueSGD };
    });

    const familyNetWorth = familyEquityValue + familyCommodityValue + familyCashValue;
    const totalNetWorth = familyNetWorth + companyValue;

    // Corporate burn rate calculation
    const companyWithdrawals = transactions.filter(
      (t) => t.entity === "COMPANY" && t.type === "WITHDRAW"
    );
    const monthlyAmounts: Record<string, number> = {};
    companyWithdrawals.forEach((t) => {
      const month = new Date(t.date).toISOString().slice(0, 7);
      monthlyAmounts[month] = (monthlyAmounts[month] || 0) + Math.abs(t.amount);
    });
    const months = Object.keys(monthlyAmounts);
    const totalBurn = Object.values(monthlyAmounts).reduce((a, b) => a + b, 0);
    const avgMonthlyBurn = months.length > 0 ? totalBurn / months.length : 0;

    // Company cash balance from manual assets
    const companyCash = manualAssets.find((m) => m.category === "CORPORATE_CASH");
    const companyCashBalance = companyCash?.balance ?? 0;
    const companyCashCurrency = companyCash?.currency ?? "CNY";
    const cashRunway = avgMonthlyBurn > 0 ? companyCashBalance / avgMonthlyBurn : Infinity;

    // Asset allocation for donut chart
    const allocation = [
      { name: "Equity (VOO/QQQ)", value: Math.round(familyEquityValue), color: "#6366f1" },
      { name: "Commodities (Gold)", value: Math.round(familyCommodityValue), color: "#f59e0b" },
      { name: "Cash Equivalents", value: Math.round(familyCashValue), color: "#10b981" },
      { name: "Corporate Cash", value: Math.round(companyValue), color: "#3b82f6" },
    ];

    return NextResponse.json({
      totalNetWorth,
      familyNetWorth,
      companyLiquidity: companyValue,
      companyCashBalance,
      companyCashCurrency,
      avgMonthlyBurn,
      cashRunway: cashRunway === Infinity ? null : Math.round(cashRunway * 10) / 10,
      allocation,
      holdings: holdingDetails,
      manualAssets: manualAssetDetails,
      transactions: transactions.slice(0, 20),
      fxRates,
      quotes,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    return NextResponse.json({ error: "Failed to load dashboard data", message, stack }, { status: 500 });
  }
}
