import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_ENTITIES = new Set(["FAMILY", "COMPANY"]);
const VALID_TYPES = new Set(["BUY", "SELL", "DEPOSIT", "WITHDRAW"]);

class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function toPositiveNumber(value: unknown, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ApiError(`${fieldName} must be a positive number.`);
  }
  return parsed;
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeText(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(`${fieldName} is required.`);
  }
  return value.trim();
}

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entity = normalizeText(body.entity, "Entity").toUpperCase();
    const type = normalizeText(body.type, "Type").toUpperCase();
    const asset = normalizeText(body.asset, "Asset");
    const currency = normalizeText(body.currency, "Currency").toUpperCase();
    const date = new Date(body.date);

    if (Number.isNaN(date.getTime())) {
      throw new ApiError("Date is invalid.");
    }
    if (!VALID_ENTITIES.has(entity)) {
      throw new ApiError("Entity must be FAMILY or COMPANY.");
    }
    if (type === "TRANSFER") {
      throw new ApiError("TRANSFER is not supported yet. Use WITHDRAW + DEPOSIT for now.");
    }
    if (!VALID_TYPES.has(type)) {
      throw new ApiError("Type must be BUY, SELL, DEPOSIT, or WITHDRAW.");
    }

    const amount = toPositiveNumber(body.amount, "Amount");
    const note = toNullableString(body.note);
    const tickerCandidate = toNullableString(body.ticker) ?? asset;
    const ticker = tickerCandidate.toUpperCase();

    const transaction = await prisma.$transaction(async (tx) => {
      if (type === "BUY") {
        const units = toPositiveNumber(body.units, "Units");
        const price = toPositiveNumber(body.price, "Price");
        const existing = await tx.holding.findFirst({
          where: { entity, ticker },
        });
        if (existing && existing.currency !== currency) {
          throw new ApiError(`Holding ${ticker} currency mismatch.`);
        }

        const cashAccount = await tx.manualAsset.findFirst({
          where: {
            entity,
            currency,
            category: entity === "COMPANY" ? "CORPORATE_CASH" : "CASH_EQUIVALENT",
          },
        });
        if (!cashAccount) {
          throw new ApiError(`No cash account found for ${entity} ${currency}.`);
        }
        if (cashAccount.balance < amount) {
          throw new ApiError(`Insufficient cash balance in ${cashAccount.name}.`);
        }

        if (existing) {
          const totalShares = existing.shares + units;
          const totalCost = existing.shares * existing.avgCost + units * price;
          await tx.holding.update({
            where: { id: existing.id },
            data: {
              shares: totalShares,
              avgCost: totalCost / totalShares,
            },
          });
        } else {
          await tx.holding.create({
            data: {
              entity,
              asset,
              ticker,
              shares: units,
              avgCost: price,
              currency,
            },
          });
        }

        await tx.manualAsset.update({
          where: { id: cashAccount.id },
          data: { balance: cashAccount.balance - amount },
        });

        return tx.transaction.create({
          data: {
            date,
            entity,
            asset,
            currency,
            amount,
            units,
            price,
            type,
            note,
          },
        });
      }

      if (type === "SELL") {
        const units = toPositiveNumber(body.units, "Units");
        const price = toPositiveNumber(body.price, "Price");
        const existing = await tx.holding.findFirst({
          where: { entity, ticker },
        });
        if (!existing) {
          throw new ApiError(`No holding found for ${ticker}.`);
        }
        if (existing.currency !== currency) {
          throw new ApiError(`Holding ${ticker} currency mismatch.`);
        }
        if (existing.shares < units) {
          throw new ApiError(`Sell units exceed current holding for ${ticker}.`);
        }

        const cashAccount = await tx.manualAsset.findFirst({
          where: {
            entity,
            currency,
            category: entity === "COMPANY" ? "CORPORATE_CASH" : "CASH_EQUIVALENT",
          },
        });
        if (!cashAccount) {
          throw new ApiError(`No cash account found for ${entity} ${currency}.`);
        }

        const newShares = existing.shares - units;
        if (newShares <= 0) {
          await tx.holding.delete({ where: { id: existing.id } });
        } else {
          await tx.holding.update({
            where: { id: existing.id },
            data: { shares: newShares },
          });
        }

        await tx.manualAsset.update({
          where: { id: cashAccount.id },
          data: { balance: cashAccount.balance + amount },
        });

        return tx.transaction.create({
          data: {
            date,
            entity,
            asset,
            currency,
            amount,
            units,
            price,
            type,
            note,
          },
        });
      }

      const existing = await tx.manualAsset.findFirst({
        where: { entity, name: asset },
      });
      if (!existing) {
        throw new ApiError(`Cash account "${asset}" does not exist for ${entity}.`);
      }
      if (existing.currency !== currency) {
        throw new ApiError(`Currency mismatch for cash account "${asset}".`);
      }

      const adjustment = type === "DEPOSIT" ? amount : -amount;
      if (type === "WITHDRAW" && existing.balance < amount) {
        throw new ApiError(`Insufficient cash balance in ${existing.name}.`);
      }

      await tx.manualAsset.update({
        where: { id: existing.id },
        data: { balance: existing.balance + adjustment },
      });

      return tx.transaction.create({
        data: {
          date,
          entity,
          asset,
          currency,
          amount,
          units: null,
          price: null,
          type,
          note,
        },
      });
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to create transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction." }, { status: 500 });
  }
}
