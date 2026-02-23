import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const assets = await prisma.manualAsset.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(assets);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const id = String(body.id ?? "").trim();
    const balance = Number(body.balance);

    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }
    if (!Number.isFinite(balance) || balance < 0) {
      return NextResponse.json({ error: "Balance must be a non-negative number." }, { status: 400 });
    }

    const asset = await prisma.manualAsset.update({
      where: { id },
      data: { balance },
    });
    return NextResponse.json(asset);
  } catch (error) {
    console.error("Failed to update manual asset:", error);
    return NextResponse.json({ error: "Failed to update manual asset." }, { status: 500 });
  }
}
