import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export interface QuoteResult {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

// --- In-memory cache ---

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const QUOTE_CACHE_TTL = 5 * 60 * 1000;  // 5 minutes
const FX_CACHE_TTL = 15 * 60 * 1000;    // 15 minutes

let quotesCache: CacheEntry<Record<string, QuoteResult>> | null = null;
let fxCache: CacheEntry<FxRates> | null = null;

function isCacheValid<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  return entry !== null && Date.now() < entry.expiry;
}

export async function getQuotes(tickers: string[]): Promise<Record<string, QuoteResult>> {
  const cacheKey = [...tickers].sort().join(",");
  if (isCacheValid(quotesCache)) {
    const cached = quotesCache.data;
    const allPresent = tickers.every((t) => t in cached);
    if (allPresent) return cached;
  }

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

  quotesCache = { data: results, expiry: Date.now() + QUOTE_CACHE_TTL };
  return results;
}

export interface FxRates {
  USDSGD: number;
  CNYSGD: number;
}

export async function getFxRates(): Promise<FxRates> {
  if (isCacheValid(fxCache)) {
    return fxCache.data;
  }

  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=SGD,CNY");
    const data = await res.json();
    const usdToSgd = data.rates?.SGD ?? 1.35;
    const usdToCny = data.rates?.CNY ?? 7.25;
    // CNY to SGD = USD to SGD / USD to CNY
    const cnyToSgd = usdToSgd / usdToCny;

    const rates: FxRates = { USDSGD: usdToSgd, CNYSGD: cnyToSgd };
    fxCache = { data: rates, expiry: Date.now() + FX_CACHE_TTL };
    return rates;
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
