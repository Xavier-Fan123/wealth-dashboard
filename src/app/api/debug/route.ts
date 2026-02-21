import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = { steps: [] };

  // Step 1: Test Prisma/Turso connection
  try {
    const holdings = await prisma.holding.findMany();
    (results.steps as string[]).push("prisma: OK");
    results.holdings = holdings.length;
  } catch (err) {
    (results.steps as string[]).push("prisma: FAIL");
    results.prismaError = err instanceof Error ? err.message : String(err);
  }

  // Step 2: Test FX rates
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=SGD,CNY");
    const data = await res.json();
    (results.steps as string[]).push("fx: OK");
    results.fx = data.rates;
  } catch (err) {
    (results.steps as string[]).push("fx: FAIL");
    results.fxError = err instanceof Error ? err.message : String(err);
  }

  // Step 3: Test yahoo-finance2
  try {
    const YahooFinance = (await import("yahoo-finance2")).default;
    const yf = new YahooFinance();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote: any = await yf.quote("VOO");
    (results.steps as string[]).push("yahoo: OK");
    results.vooPrice = quote?.regularMarketPrice;
  } catch (err) {
    (results.steps as string[]).push("yahoo: FAIL");
    results.yahooError = err instanceof Error ? err.message : String(err);
  }

  // Step 4: Env check
  results.hasTursoUrl = !!process.env.TURSO_DATABASE_URL;
  results.hasTursoToken = !!process.env.TURSO_AUTH_TOKEN;

  return NextResponse.json(results);
}
