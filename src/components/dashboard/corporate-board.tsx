"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Building2, TrendingDown, Clock } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  entity: string;
  asset: string;
  currency: string;
  amount: number;
  type: string;
  note: string | null;
}

interface CorporateBoardProps {
  companyCashBalance: number;
  companyCashCurrency: string;
  companyLiquidity: number;
  avgMonthlyBurn: number;
  cashRunway: number | null;
  transactions: Transaction[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-destructive">-{formatNumber(payload[0].value, 0)} CNY</p>
      </div>
    );
  }
  return null;
}

export function CorporateBoard({
  companyCashBalance,
  companyCashCurrency,
  companyLiquidity,
  avgMonthlyBurn,
  cashRunway,
  transactions,
}: CorporateBoardProps) {
  // Build monthly burn chart data
  const companyWithdrawals = transactions.filter(
    (t) => t.entity === "COMPANY" && t.type === "WITHDRAW"
  );
  const monthlyData: Record<string, number> = {};
  companyWithdrawals.forEach((t) => {
    const month = new Date(t.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthlyData[month] = (monthlyData[month] || 0) + Math.abs(t.amount);
  });
  const chartData = Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Cash Balance</CardTitle>
            <Building2 className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(companyCashBalance, companyCashCurrency)}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(companyLiquidity)} in SGD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Monthly Burn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(avgMonthlyBurn, companyCashCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">Average monthly outflow</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Cash Runway</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {cashRunway ? `${cashRunway} months` : "Unlimited"}
            </div>
            <Badge variant={cashRunway && cashRunway < 6 ? "destructive" : "success"} className="mt-1">
              {cashRunway && cashRunway < 6 ? "Low Runway" : "Healthy"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Outflow History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} />
                  <YAxis stroke="#a1a1aa" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
