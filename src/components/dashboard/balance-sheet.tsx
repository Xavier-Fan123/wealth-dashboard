"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface BalanceLine {
  name: string;
  value: number;
}

interface BalanceSection {
  assets: BalanceLine[];
  liabilities: BalanceLine[];
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
}

interface BalanceSheetData {
  asOf: string;
  family: BalanceSection;
  company: BalanceSection;
  consolidated: BalanceSection;
}

interface BalanceSheetProps {
  data: BalanceSheetData;
}

function SectionCard({ title, section }: { title: string; section: BalanceSection }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        <Badge variant="info">SGD</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Assets</p>
          <div className="space-y-2">
            {section.assets.map((line) => (
              <div key={line.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{line.name}</span>
                <span className="font-mono text-foreground">{formatCurrency(line.value)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Liabilities</p>
          <div className="space-y-2">
            {section.liabilities.map((line) => (
              <div key={line.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{line.name}</span>
                <span className="font-mono text-foreground">{formatCurrency(line.value)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Assets</span>
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(section.totalAssets)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Liabilities</span>
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(section.totalLiabilities)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Equity</span>
            <span className="font-mono font-semibold text-primary">{formatCurrency(section.equity)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BalanceSheet({ data }: BalanceSheetProps) {
  const asOf = new Date(data.asOf).toLocaleString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Balance Sheet Snapshot</h2>
        <span className="text-xs text-muted-foreground">As of {asOf}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard title="Family" section={data.family} />
        <SectionCard title="Company" section={data.company} />
        <SectionCard title="Consolidated" section={data.consolidated} />
      </div>
    </div>
  );
}
