import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const assets = await prisma.manualAsset.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(assets);
}

export async function PUT(req: NextRequest) {
  void req;
  return NextResponse.json(
    {
      error:
        "Manual asset balances cannot be edited directly. Use /api/transactions with DEPOSIT, WITHDRAW, or TRANSFER so the cash ledger stays in sync.",
    },
    { status: 405 }
  );
}
