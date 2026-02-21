import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const assets = await prisma.manualAsset.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(assets);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const asset = await prisma.manualAsset.update({
    where: { id: body.id },
    data: { balance: body.balance },
  });
  return NextResponse.json(asset);
}
