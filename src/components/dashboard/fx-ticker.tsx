"use client";

import { formatNumber } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface FxTickerProps {
  fxRates: { USDSGD: number; CNYSGD: number };
  lastUpdated: string;
  onRefresh: () => void;
  loading: boolean;
}

export function FxTicker({ fxRates, lastUpdated, onRefresh, loading }: FxTickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 sm:gap-4 sm:px-4 sm:py-2 md:gap-6">
      <div className="flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
        <span className="text-muted-foreground">USD/SGD</span>
        <span className="font-mono font-medium text-foreground">{formatNumber(fxRates.USDSGD, 4)}</span>
      </div>
      <div className="hidden h-4 w-px bg-border sm:block" />
      <div className="flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
        <span className="text-muted-foreground">CNY/SGD</span>
        <span className="font-mono font-medium text-foreground">{formatNumber(fxRates.CNYSGD, 4)}</span>
      </div>
      <div className="hidden h-4 w-px bg-border sm:block" />
      <span className="hidden text-xs text-muted-foreground sm:inline">{lastUpdated}</span>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
