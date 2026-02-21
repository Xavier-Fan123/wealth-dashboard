import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const holdings = await prisma.holding.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(holdings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const holding = await prisma.holding.create({
    data: {
      entity: body.entity,
      asset: body.asset,
      ticker: body.ticker,
      shares: body.shares,
      avgCost: body.avgCost,
      currency: body.currency,
    },
  });
  return NextResponse.json(holding, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const holding = await prisma.holding.update({
    where: { id: body.id },
    data: {
      shares: body.shares,
      avgCost: body.avgCost,
    },
  });
  return NextResponse.json(holding);
}
