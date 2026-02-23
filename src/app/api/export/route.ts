import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values.map(escapeCsv).join(",");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "transactions";

  try {
    if (type === "transactions") {
      const transactions = await prisma.transaction.findMany({
        orderBy: { date: "desc" },
      });

      const header = toCsvRow(["Date", "Entity", "Type", "Asset", "Currency", "Amount", "Units", "Price", "Note"]);
      const rows = transactions.map((t) =>
        toCsvRow([
          t.date.toISOString().slice(0, 10),
          t.entity,
          t.type,
          t.asset,
          t.currency,
          t.amount,
          t.units,
          t.price,
          t.note,
        ])
      );

      const csv = [header, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="transactions_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    if (type === "holdings") {
      const holdings = await prisma.holding.findMany();

      const header = toCsvRow(["Entity", "Asset", "Ticker", "Shares", "Avg Cost", "Currency"]);
      const rows = holdings.map((h) =>
        toCsvRow([h.entity, h.asset, h.ticker, h.shares, h.avgCost, h.currency])
      );

      const csv = [header, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="holdings_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    if (type === "balance-items") {
      const items = await prisma.balanceItem.findMany();

      const header = toCsvRow(["Entity", "Type", "Name", "Amount", "Currency", "Due Date", "Note"]);
      const rows = items.map((item) =>
        toCsvRow([
          item.entity,
          item.type,
          item.name,
          item.amount,
          item.currency,
          item.dueDate?.toISOString().slice(0, 10),
          item.note,
        ])
      );

      const csv = [header, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="balance_items_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid export type. Use: transactions, holdings, balance-items" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data." }, { status: 500 });
  }
}
