import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuotes, getFxRates, convertToSGD } from "@/lib/market";

export const dynamic = "force-dynamic";

interface ReplayedHolding {
  entity: string;
  ticker: string;
  shares: number;
  avgCost: number;
}

interface BalanceLine {
  name: string;
  value: number;
}

interface BalanceSection {
  assets: BalanceLine[];
  liabilities: BalanceLine[];
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
}

function roundValue(value: number): number {
  return Math.round(value);
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeTicker(asset: string): string {
  const normalized = asset.trim().toUpperCase();
  if (normalized === "GOLD ETF") return "GLD";
  return normalized;
}

function formatMonthLabel(monthKey: string): string {
  const date = new Date(`${monthKey}-01T00:00:00.000Z`);
  return date.toLocaleDateString("en-SG", { month: "short", year: "2-digit" });
}

function buildBalanceSection(assets: BalanceLine[], liabilities: BalanceLine[]): BalanceSection {
  const totalAssets = assets.reduce((sum, line) => sum + line.value, 0);
  const totalLiabilities = liabilities.reduce((sum, line) => sum + line.value, 0);
  return {
    assets,
    liabilities,
    totalAssets: roundValue(totalAssets),
    totalLiabilities: roundValue(totalLiabilities),
    equity: roundValue(totalAssets - totalLiabilities),
  };
}

export async function GET() {
  try {
    const [holdings, manualAssets, allTransactions, recentTransactions, balanceItems, fxRates] = await Promise.all([
      prisma.holding.findMany(),
      prisma.manualAsset.findMany(),
      prisma.transaction.findMany({
        orderBy: { date: "desc" },
        select: { id: true, date: true, entity: true, asset: true, currency: true, amount: true, units: true, price: true, type: true },
      }),
      prisma.transaction.findMany({
        orderBy: { date: "desc" },
        take: 20,
      }),
      prisma.balanceItem.findMany({ orderBy: [{ entity: "asc" }, { type: "asc" }, { createdAt: "desc" }] }),
      getFxRates(),
    ]);

    const tickers = Array.from(
      new Set(
        holdings
          .map((holding) => holding.ticker?.trim().toUpperCase())
          .filter((ticker): ticker is string => Boolean(ticker))
      )
    );
    const quotes = tickers.length > 0 ? await getQuotes(tickers) : {};

    let familyEquityValue = 0;
    let familyCommodityValue = 0;
    let familyCashValue = 0;
    let companyInvestmentValue = 0;
    let companyCashValue = 0;
    let familyReceivableValue = 0;
    let familyLiabilityValue = 0;
    let companyReceivableValue = 0;
    let companyLiabilityValue = 0;

    const holdingDetails = holdings.map((holding) => {
      const normalizedTicker = holding.ticker.toUpperCase();
      const quote = quotes[normalizedTicker];
      const currentPrice = quote?.price ?? 0;
      const marketValue = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.avgCost;
      const unrealizedPL = marketValue - costBasis;
      const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;
      const marketValueSGD = convertToSGD(marketValue, holding.currency, fxRates);

      if (holding.entity === "COMPANY") {
        companyInvestmentValue += marketValueSGD;
      } else if (normalizedTicker === "GLD") {
        familyCommodityValue += marketValueSGD;
      } else {
        familyEquityValue += marketValueSGD;
      }

      return {
        ...holding,
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

    const manualAssetDetails = manualAssets.map((asset) => {
      const valueSGD = convertToSGD(asset.balance, asset.currency, fxRates);
      if (asset.entity === "COMPANY") {
        companyCashValue += valueSGD;
      } else {
        familyCashValue += valueSGD;
      }
      return { ...asset, valueSGD };
    });

    const balanceItemDetails = balanceItems.map((item) => {
      const valueSGD = convertToSGD(item.amount, item.currency, fxRates);
      if (item.entity === "FAMILY") {
        if (item.type === "RECEIVABLE") {
          familyReceivableValue += valueSGD;
        } else {
          familyLiabilityValue += valueSGD;
        }
      } else {
        if (item.type === "RECEIVABLE") {
          companyReceivableValue += valueSGD;
        } else {
          companyLiabilityValue += valueSGD;
        }
      }
      return { ...item, valueSGD };
    });

    const familyAssetValue = familyEquityValue + familyCommodityValue + familyCashValue + familyReceivableValue;
    const familyNetWorth = familyAssetValue - familyLiabilityValue;
    const companyAssetValue = companyInvestmentValue + companyCashValue + companyReceivableValue;
    const companyNetWorth = companyAssetValue - companyLiabilityValue;
    const companyLiquidity = companyCashValue;
    const totalNetWorth = familyNetWorth + companyNetWorth;

    const companyOutflows = allTransactions.filter(
      (transaction) =>
        transaction.entity === "COMPANY" && transaction.type === "WITHDRAW"
    );
    const monthlyBurnSGD: Record<string, number> = {};
    for (const transaction of companyOutflows) {
      const monthKey = transaction.date.toISOString().slice(0, 7);
      const amountSGD = convertToSGD(Math.abs(transaction.amount), transaction.currency, fxRates);
      monthlyBurnSGD[monthKey] = (monthlyBurnSGD[monthKey] ?? 0) + amountSGD;
    }
    const monthKeys = Object.keys(monthlyBurnSGD).sort();
    const totalBurnSGD = Object.values(monthlyBurnSGD).reduce((sum, amount) => sum + amount, 0);
    const avgMonthlyBurnSGD = monthKeys.length > 0 ? totalBurnSGD / monthKeys.length : 0;
    const companyMonthlyOutflow = monthKeys.map((monthKey) => ({
      month: monthKey,
      label: formatMonthLabel(monthKey),
      amountSGD: roundValue(monthlyBurnSGD[monthKey]),
    }));

    const companyCashAccounts = manualAssets.filter((asset) => asset.entity === "COMPANY");
    const companyCashValueSGD = companyCashAccounts.reduce(
      (sum, asset) => sum + convertToSGD(asset.balance, asset.currency, fxRates),
      0
    );
    const companyPrimaryCash = companyCashAccounts[0];
    const companyCashBalance = companyPrimaryCash?.balance ?? 0;
    const companyCashCurrency = companyPrimaryCash?.currency ?? "SGD";
    const cashRunway = avgMonthlyBurnSGD > 0 ? companyCashValueSGD / avgMonthlyBurnSGD : null;

    const allocation = [
      { name: "Family Equity", value: roundValue(familyEquityValue), color: "#6366f1" },
      { name: "Family Commodities", value: roundValue(familyCommodityValue), color: "#f59e0b" },
      { name: "Family Cash", value: roundValue(familyCashValue), color: "#10b981" },
      { name: "Receivables", value: roundValue(familyReceivableValue + companyReceivableValue), color: "#22c55e" },
      { name: "Company Cash", value: roundValue(companyCashValue), color: "#3b82f6" },
      { name: "Company Investments", value: roundValue(companyInvestmentValue), color: "#8b5cf6" },
    ];

    const familySection = buildBalanceSection(
      [
        { name: "Cash & Equivalents", value: familyCashValue },
        { name: "Public Equity", value: familyEquityValue },
        { name: "Commodities", value: familyCommodityValue },
        { name: "Receivables", value: familyReceivableValue },
      ],
      [{ name: "Debt & Payables", value: familyLiabilityValue }]
    );
    const companySection = buildBalanceSection(
      [
        { name: "Cash & Equivalents", value: companyCashValue },
        { name: "Investments", value: companyInvestmentValue },
        { name: "Receivables", value: companyReceivableValue },
      ],
      [{ name: "Debt & Payables", value: companyLiabilityValue }]
    );
    const consolidatedSection = buildBalanceSection(
      [
        {
          name: "Total Assets",
          value: familySection.totalAssets + companySection.totalAssets,
        },
      ],
      [
        {
          name: "Total Liabilities",
          value: familySection.totalLiabilities + companySection.totalLiabilities,
        },
      ]
    );

    const balanceSheet = {
      asOf: new Date().toISOString(),
      family: familySection,
      company: companySection,
      consolidated: consolidatedSection,
    };

    const cashAccountLookup = new Map<
      string,
      {
        id: string;
        name: string;
        balance: number;
        currency: string;
        entity: string;
        category: string;
      }
    >();
    for (const asset of manualAssets) {
      const key = `${asset.entity}|${asset.currency}`;
      if (!cashAccountLookup.has(key)) {
        cashAccountLookup.set(key, asset);
      }
    }

    const expectedCashById = new Map<string, number>();
    for (const asset of manualAssets) {
      expectedCashById.set(asset.id, 0);
    }

    const expectedHoldingMap = new Map<string, ReplayedHolding>();
    const transactionsAsc = [...allTransactions].sort((a, b) => a.date.getTime() - b.date.getTime());
    for (const transaction of transactionsAsc) {
      const ticker = normalizeTicker(transaction.asset);
      const key = `${transaction.entity}|${ticker}`;

      if (transaction.type === "BUY" && transaction.units && transaction.price) {
        const prev = expectedHoldingMap.get(key);
        if (!prev) {
          expectedHoldingMap.set(key, {
            entity: transaction.entity,
            ticker,
            shares: transaction.units,
            avgCost: transaction.price,
          });
        } else {
          const totalShares = prev.shares + transaction.units;
          const totalCost = prev.shares * prev.avgCost + transaction.units * transaction.price;
          expectedHoldingMap.set(key, {
            ...prev,
            shares: totalShares,
            avgCost: totalShares > 0 ? totalCost / totalShares : 0,
          });
        }

        const cashAccount = cashAccountLookup.get(`${transaction.entity}|${transaction.currency}`);
        if (cashAccount) {
          expectedCashById.set(
            cashAccount.id,
            (expectedCashById.get(cashAccount.id) ?? 0) - Math.abs(transaction.amount)
          );
        }
      } else if (transaction.type === "SELL" && transaction.units) {
        const prev = expectedHoldingMap.get(key);
        if (prev) {
          const newShares = prev.shares - transaction.units;
          if (newShares <= 0) {
            expectedHoldingMap.delete(key);
          } else {
            expectedHoldingMap.set(key, {
              ...prev,
              shares: newShares,
            });
          }
        }

        const cashAccount = cashAccountLookup.get(`${transaction.entity}|${transaction.currency}`);
        if (cashAccount) {
          expectedCashById.set(
            cashAccount.id,
            (expectedCashById.get(cashAccount.id) ?? 0) + Math.abs(transaction.amount)
          );
        }
      } else if (transaction.type === "DEPOSIT" || transaction.type === "WITHDRAW") {
        const cashAccount = manualAssets.find(
          (asset) =>
            asset.entity === transaction.entity &&
            asset.name === transaction.asset &&
            asset.currency === transaction.currency
        );
        if (cashAccount) {
          const sign = transaction.type === "DEPOSIT" ? 1 : -1;
          expectedCashById.set(
            cashAccount.id,
            (expectedCashById.get(cashAccount.id) ?? 0) + sign * Math.abs(transaction.amount)
          );
        }
      }
    }

    const cashMismatches = manualAssets
      .map((asset) => {
        const expected = expectedCashById.get(asset.id) ?? 0;
        const diff = asset.balance - expected;
        return {
          id: asset.id,
          entity: asset.entity,
          name: asset.name,
          currency: asset.currency,
          actual: asset.balance,
          expected,
          diff,
        };
      })
      .filter((item) => Math.abs(item.diff) > 0.01);

    const actualHoldingMap = new Map(
      holdings.map((holding) => [
        `${holding.entity}|${holding.ticker.toUpperCase()}`,
        {
          entity: holding.entity,
          ticker: holding.ticker.toUpperCase(),
          shares: holding.shares,
          avgCost: holding.avgCost,
        },
      ])
    );
    const holdingKeys = new Set([...expectedHoldingMap.keys(), ...actualHoldingMap.keys()]);
    const holdingMismatches = Array.from(holdingKeys)
      .map((key) => {
        const expected = expectedHoldingMap.get(key);
        const actual = actualHoldingMap.get(key);
        const expectedShares = expected?.shares ?? 0;
        const actualShares = actual?.shares ?? 0;
        const expectedAvgCost = expected?.avgCost ?? 0;
        const actualAvgCost = actual?.avgCost ?? 0;
        const shareDiff = actualShares - expectedShares;
        const avgCostDiff = actualAvgCost - expectedAvgCost;
        return {
          entity: actual?.entity ?? expected?.entity ?? "UNKNOWN",
          ticker: actual?.ticker ?? expected?.ticker ?? "UNKNOWN",
          expectedShares,
          actualShares,
          shareDiff,
          expectedAvgCost,
          actualAvgCost,
          avgCostDiff,
        };
      })
      .filter((item) => Math.abs(item.shareDiff) > 0.000001 || Math.abs(item.avgCostDiff) > 0.01);

    const reconciliation = {
      checkedAt: new Date().toISOString(),
      status: cashMismatches.length === 0 && holdingMismatches.length === 0 ? "ok" : "warning",
      cashMismatches,
      holdingMismatches,
    };

    return NextResponse.json({
      totalNetWorth,
      familyNetWorth,
      companyLiquidity,
      companyCashBalance,
      companyCashCurrency,
      avgMonthlyBurn: roundValue(avgMonthlyBurnSGD),
      cashRunway: cashRunway == null ? null : Math.round(cashRunway * 10) / 10,
      companyMonthlyOutflow,
      allocation,
      balanceSheet,
      reconciliation,
      balanceItems: balanceItemDetails,
      holdings: holdingDetails,
      manualAssets: manualAssetDetails,
      transactions: recentTransactions,
      fxRates,
      quotes,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to load dashboard data", message },
      { status: 500 }
    );
  }
}
