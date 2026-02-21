import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export interface QuoteResult {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

export async function getQuotes(tickers: string[]): Promise<Record<string, QuoteResult>> {
  const results: Record<string, QuoteResult> = {};

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quote: any = await yahooFinance.quote(ticker);
        results[ticker] = {
          ticker,
          price: quote.regularMarketPrice ?? 0,
          change: quote.regularMarketChange ?? 0,
          changePercent: quote.regularMarketChangePercent ?? 0,
          currency: quote.currency ?? "USD",
        };
      } catch (err) {
        console.error(`Failed to fetch quote for ${ticker}:`, err);
        results[ticker] = {
          ticker,
          price: 0,
          change: 0,
          changePercent: 0,
          currency: "USD",
        };
      }
    })
  );

  return results;
}

export interface FxRates {
  USDSGD: number;
  CNYSGD: number;
}

export async function getFxRates(): Promise<FxRates> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=SGD,CNY");
    const data = await res.json();
    const usdToSgd = data.rates?.SGD ?? 1.35;
    const usdToCny = data.rates?.CNY ?? 7.25;
    // CNY to SGD = USD to SGD / USD to CNY
    const cnyToSgd = usdToSgd / usdToCny;

    return {
      USDSGD: usdToSgd,
      CNYSGD: cnyToSgd,
    };
  } catch (err) {
    console.error("Failed to fetch FX rates:", err);
    return { USDSGD: 1.35, CNYSGD: 0.186 };
  }
}

export function convertToSGD(amount: number, currency: string, fxRates: FxRates): number {
  switch (currency) {
    case "SGD":
      return amount;
    case "USD":
      return amount * fxRates.USDSGD;
    case "CNY":
      return amount * fxRates.CNYSGD;
    default:
      return amount;
  }
}
