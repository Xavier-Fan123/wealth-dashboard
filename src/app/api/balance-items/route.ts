import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_ENTITIES = new Set(["FAMILY", "COMPANY"]);
const VALID_TYPES = new Set(["LIABILITY", "PAYABLE", "RECEIVABLE"]);

class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizeText(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(`${fieldName} is required.`);
  }
  return value.trim();
}

function toPositiveNumber(value: unknown, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ApiError(`${fieldName} must be a positive number.`);
  }
  return parsed;
}

function optionalDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError("Due date is invalid.");
  }
  return parsed;
}

export async function GET() {
  const items = await prisma.balanceItem.findMany({
    orderBy: [{ entity: "asc" }, { type: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entity = normalizeText(body.entity, "Entity").toUpperCase();
    const type = normalizeText(body.type, "Type").toUpperCase();
    const name = normalizeText(body.name, "Name");
    const currency = normalizeText(body.currency, "Currency").toUpperCase();
    const amount = toPositiveNumber(body.amount, "Amount");
    const dueDate = optionalDate(body.dueDate);
    const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

    if (!VALID_ENTITIES.has(entity)) {
      throw new ApiError("Entity must be FAMILY or COMPANY.");
    }
    if (!VALID_TYPES.has(type)) {
      throw new ApiError("Type must be LIABILITY, PAYABLE, or RECEIVABLE.");
    }

    const item = await prisma.balanceItem.create({
      data: { entity, type, name, currency, amount, dueDate, note },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to create balance item:", error);
    return NextResponse.json({ error: "Failed to create balance item." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = normalizeText(body.id, "ID");
    const amount = toPositiveNumber(body.amount, "Amount");
    const dueDate = optionalDate(body.dueDate);
    const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

    const item = await prisma.balanceItem.update({
      where: { id },
      data: { amount, dueDate, note },
    });

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to update balance item:", error);
    return NextResponse.json({ error: "Failed to update balance item." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const id = normalizeText(body.id, "ID");
    await prisma.balanceItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to delete balance item:", error);
    return NextResponse.json({ error: "Failed to delete balance item." }, { status: 500 });
  }
}
