import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const transaction = await prisma.transaction.create({
    data: {
      date: new Date(body.date),
      entity: body.entity,
      asset: body.asset,
      currency: body.currency,
      amount: body.amount,
      units: body.units || null,
      price: body.price || null,
      type: body.type,
      note: body.note || null,
    },
  });

  // Determine which cash account to use for this currency
  const CASH_ACCOUNT: Record<string, string> = {
    USD: "USD Cash",
    CNY: "CNY Cash",
    SGD: "Company Bank Balance",
  };

  // Update holdings or manual assets based on transaction type
  if (body.type === "BUY" && body.units && body.price) {
    // 1. Increase holding
    const existing = await prisma.holding.findFirst({
      where: { entity: body.entity, ticker: body.ticker || body.asset },
    });
    if (existing) {
      const totalShares = existing.shares + body.units;
      const totalCost = existing.shares * existing.avgCost + body.units * body.price;
      await prisma.holding.update({
        where: { id: existing.id },
        data: {
          shares: totalShares,
          avgCost: totalCost / totalShares,
        },
      });
    } else {
      await prisma.holding.create({
        data: {
          entity: body.entity,
          asset: body.asset,
          ticker: body.ticker || body.asset,
          shares: body.units,
          avgCost: body.price,
          currency: body.currency,
        },
      });
    }

    // 2. Deduct cash (BUY spends cash)
    const cashName = CASH_ACCOUNT[body.currency];
    if (cashName) {
      const cashAccount = await prisma.manualAsset.findFirst({
        where: { entity: body.entity, name: cashName },
      });
      if (cashAccount) {
        await prisma.manualAsset.update({
          where: { id: cashAccount.id },
          data: { balance: cashAccount.balance - Math.abs(body.amount) },
        });
      }
    }
  } else if (body.type === "SELL" && body.units) {
    // 1. Decrease holding
    const existing = await prisma.holding.findFirst({
      where: { entity: body.entity, ticker: body.ticker || body.asset },
    });
    if (existing) {
      const newShares = existing.shares - body.units;
      if (newShares <= 0) {
        await prisma.holding.delete({ where: { id: existing.id } });
      } else {
        await prisma.holding.update({
          where: { id: existing.id },
          data: { shares: newShares },
        });
      }
    }

    // 2. Add cash back (SELL receives cash)
    const cashName = CASH_ACCOUNT[body.currency];
    if (cashName) {
      const cashAccount = await prisma.manualAsset.findFirst({
        where: { entity: body.entity, name: cashName },
      });
      if (cashAccount) {
        await prisma.manualAsset.update({
          where: { id: cashAccount.id },
          data: { balance: cashAccount.balance + Math.abs(body.amount) },
        });
      }
    }
  } else if (body.type === "DEPOSIT" || body.type === "WITHDRAW") {
    const existing = await prisma.manualAsset.findFirst({
      where: { entity: body.entity, name: body.asset },
    });
    if (existing) {
      const adjustment = body.type === "DEPOSIT" ? Math.abs(body.amount) : -Math.abs(body.amount);
      await prisma.manualAsset.update({
        where: { id: existing.id },
        data: { balance: existing.balance + adjustment },
      });
    }
  }

  return NextResponse.json(transaction, { status: 201 });
}
