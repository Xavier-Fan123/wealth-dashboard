"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

interface HoldingDetail {
  id: string;
  entity: string;
  asset: string;
  ticker: string;
  shares: number;
  avgCost: number;
  currency: string;
  currentPrice: number;
  marketValue: number;
  marketValueSGD: number;
  costBasis: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  change: number;
  changePercent: number;
}

interface ManualAssetDetail {
  id: string;
  entity: string;
  name: string;
  balance: number;
  currency: string;
  category: string;
  valueSGD: number;
}

interface PortfolioTableProps {
  holdings: HoldingDetail[];
  manualAssets: ManualAssetDetail[];
}

export function PortfolioTable({ holdings, manualAssets }: PortfolioTableProps) {
  const familyHoldings = holdings.filter((h) => h.entity === "FAMILY");
  const familyManual = manualAssets.filter((m) => m.entity === "FAMILY");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Family Portfolio Tracker
          <Badge variant="info">Live Prices</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile: Card layout */}
        <div className="space-y-3 lg:hidden">
          {familyHoldings.map((h) => (
            <div key={h.id} className="rounded-lg border border-border/50 bg-accent/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {h.ticker}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{h.asset}</div>
                    <div className="text-xs text-muted-foreground">{h.currency}</div>
                  </div>
                </div>
                <span className={`text-sm font-medium ${h.changePercent >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatPercent(h.changePercent)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Shares</span>
                  <div className="font-mono">{formatNumber(h.shares, 0)}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Market Price</span>
                  <div className="font-mono">${formatNumber(h.currentPrice)}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Value (SGD)</span>
                  <div className="font-mono">{formatCurrency(h.marketValueSGD)}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">P&L</span>
                  <div className={`font-mono ${h.unrealizedPL >= 0 ? "text-success" : "text-destructive"}`}>
                    ${formatNumber(h.unrealizedPL, 0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {familyManual.map((m) => (
            <div key={m.id} className="rounded-lg border border-border/50 bg-accent/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-xs font-bold text-success">
                    $
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.currency} | Cash</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{formatCurrency(m.balance, m.currency)}</div>
                  <div className="font-mono text-xs text-muted-foreground">{formatCurrency(m.valueSGD)} SGD</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Asset</th>
                <th className="pb-3 pr-4 text-right font-medium">Shares</th>
                <th className="pb-3 pr-4 text-right font-medium">Avg Cost</th>
                <th className="pb-3 pr-4 text-right font-medium">Market Price</th>
                <th className="pb-3 pr-4 text-right font-medium">Day Change</th>
                <th className="pb-3 pr-4 text-right font-medium">Market Value</th>
                <th className="pb-3 pr-4 text-right font-medium">Value (SGD)</th>
                <th className="pb-3 text-right font-medium">Unrealized P&L</th>
              </tr>
            </thead>
            <tbody>
              {familyHoldings.map((h) => (
                <tr key={h.id} className="border-b border-border/50 hover:bg-accent/50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {h.ticker}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{h.asset}</div>
                        <div className="text-xs text-muted-foreground">{h.currency}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">{formatNumber(h.shares, 0)}</td>
                  <td className="py-3 pr-4 text-right font-mono">${formatNumber(h.avgCost)}</td>
                  <td className="py-3 pr-4 text-right font-mono">${formatNumber(h.currentPrice)}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className={h.changePercent >= 0 ? "text-success" : "text-destructive"}>
                      {formatPercent(h.changePercent)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">${formatNumber(h.marketValue, 0)}</td>
                  <td className="py-3 pr-4 text-right font-mono">{formatCurrency(h.marketValueSGD)}</td>
                  <td className="py-3 text-right">
                    <div className={h.unrealizedPL >= 0 ? "text-success" : "text-destructive"}>
                      <div className="font-mono">${formatNumber(h.unrealizedPL, 0)}</div>
                      <div className="text-xs">{formatPercent(h.unrealizedPLPercent)}</div>
                    </div>
                  </td>
                </tr>
              ))}
              {familyManual.map((m) => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-accent/50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-xs font-bold text-success">
                        $
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.currency} | Cash</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-muted-foreground">-</td>
                  <td className="py-3 pr-4 text-right font-mono text-muted-foreground">-</td>
                  <td className="py-3 pr-4 text-right font-mono text-muted-foreground">-</td>
                  <td className="py-3 pr-4 text-right text-muted-foreground">-</td>
                  <td className="py-3 pr-4 text-right font-mono">{formatCurrency(m.balance, m.currency)}</td>
                  <td className="py-3 pr-4 text-right font-mono">{formatCurrency(m.valueSGD)}</td>
                  <td className="py-3 text-right text-muted-foreground">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
