import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_ENTITIES = new Set(["FAMILY", "COMPANY"]);
const VALID_CURRENCIES = new Set(["USD", "SGD", "CNY"]);

export async function GET() {
  const holdings = await prisma.holding.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(holdings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entity = String(body.entity ?? "").trim().toUpperCase();
    const asset = String(body.asset ?? "").trim();
    const ticker = String(body.ticker ?? "").trim().toUpperCase();
    const currency = String(body.currency ?? "").trim().toUpperCase();
    const shares = Number(body.shares);
    const avgCost = Number(body.avgCost);

    if (!VALID_ENTITIES.has(entity)) {
      return NextResponse.json({ error: "Entity must be FAMILY or COMPANY." }, { status: 400 });
    }
    if (!asset) {
      return NextResponse.json({ error: "Asset name is required." }, { status: 400 });
    }
    if (!ticker) {
      return NextResponse.json({ error: "Ticker is required." }, { status: 400 });
    }
    if (!VALID_CURRENCIES.has(currency)) {
      return NextResponse.json({ error: "Currency must be USD, SGD, or CNY." }, { status: 400 });
    }
    if (!Number.isFinite(shares) || shares <= 0) {
      return NextResponse.json({ error: "Shares must be a positive number." }, { status: 400 });
    }
    if (!Number.isFinite(avgCost) || avgCost <= 0) {
      return NextResponse.json({ error: "Average cost must be a positive number." }, { status: 400 });
    }

    const holding = await prisma.holding.create({
      data: { entity, asset, ticker, shares, avgCost, currency },
    });
    return NextResponse.json(holding, { status: 201 });
  } catch (error) {
    console.error("Failed to create holding:", error);
    return NextResponse.json({ error: "Failed to create holding." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const id = String(body.id ?? "").trim();
    const shares = Number(body.shares);
    const avgCost = Number(body.avgCost);

    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }
    if (!Number.isFinite(shares) || shares <= 0) {
      return NextResponse.json({ error: "Shares must be a positive number." }, { status: 400 });
    }
    if (!Number.isFinite(avgCost) || avgCost <= 0) {
      return NextResponse.json({ error: "Average cost must be a positive number." }, { status: 400 });
    }

    const holding = await prisma.holding.update({
      where: { id },
      data: { shares, avgCost },
    });
    return NextResponse.json(holding);
  } catch (error) {
    console.error("Failed to update holding:", error);
    return NextResponse.json({ error: "Failed to update holding." }, { status: 500 });
  }
}
