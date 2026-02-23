"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface CashMismatch {
  id: string;
  entity: string;
  name: string;
  currency: string;
  actual: number;
  expected: number;
  diff: number;
}

interface HoldingMismatch {
  entity: string;
  ticker: string;
  expectedShares: number;
  actualShares: number;
  shareDiff: number;
  expectedAvgCost: number;
  actualAvgCost: number;
  avgCostDiff: number;
}

interface ReconciliationData {
  checkedAt: string;
  status: "ok" | "warning";
  cashMismatches: CashMismatch[];
  holdingMismatches: HoldingMismatch[];
}

interface ReconciliationPanelProps {
  data: ReconciliationData;
}

export function ReconciliationPanel({ data }: ReconciliationPanelProps) {
  const checkedAt = new Date(data.checkedAt).toLocaleString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const hasIssues = data.status !== "ok";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Ledger Reconciliation</CardTitle>
        <Badge variant={hasIssues ? "warning" : "success"}>
          {hasIssues ? "Needs Review" : "In Sync"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          {hasIssues ? (
            <AlertTriangle className="h-4 w-4 text-warning" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-success" />
          )}
          <span className="text-muted-foreground">Last checked: {checkedAt}</span>
        </div>

        {data.cashMismatches.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cash Account Mismatches
            </p>
            <div className="space-y-2">
              {data.cashMismatches.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {item.entity} | {item.name}
                    </span>
                    <span className="font-mono text-warning">
                      Diff {formatCurrency(item.diff, item.currency)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Actual {formatCurrency(item.actual, item.currency)}</span>
                    <span>Expected {formatCurrency(item.expected, item.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.holdingMismatches.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Holding Mismatches
            </p>
            <div className="space-y-2">
              {data.holdingMismatches.slice(0, 6).map((item) => (
                <div
                  key={`${item.entity}-${item.ticker}`}
                  className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {item.entity} | {item.ticker}
                    </span>
                    <span className="font-mono text-warning">
                      Share diff {formatNumber(item.shareDiff, 4)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Actual {formatNumber(item.actualShares, 4)}</span>
                    <span>Expected {formatNumber(item.expectedShares, 4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasIssues && (
          <p className="text-sm text-muted-foreground">
            Holdings and cash balances are consistent with transaction replay.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
