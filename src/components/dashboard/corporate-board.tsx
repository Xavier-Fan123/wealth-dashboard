"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Building2, TrendingDown, Clock } from "lucide-react";

interface MonthlyOutflow {
  month: string;
  label: string;
  amountSGD: number;
}

interface CorporateBoardProps {
  companyCashBalance: number;
  companyCashCurrency: string;
  companyLiquidity: number;
  avgMonthlyBurn: number;
  cashRunway: number | null;
  companyMonthlyOutflow: MonthlyOutflow[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-destructive">-{formatNumber(payload[0].value, 0)} SGD</p>
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
  companyMonthlyOutflow,
}: CorporateBoardProps) {
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
              {formatCurrency(avgMonthlyBurn, "SGD")}
            </div>
            <p className="text-xs text-muted-foreground">Average monthly outflow (SGD-converted)</p>
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

      {companyMonthlyOutflow.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Outflow History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyMonthlyOutflow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="label" stroke="#a1a1aa" fontSize={12} />
                  <YAxis stroke="#a1a1aa" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amountSGD" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
