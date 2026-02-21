"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Users, Building2, Activity } from "lucide-react";

interface KPICardsProps {
  totalNetWorth: number;
  familyNetWorth: number;
  companyLiquidity: number;
  cashRunway: number | null;
}

export function KPICards({ totalNetWorth, familyNetWorth, companyLiquidity, cashRunway }: KPICardsProps) {
  const cards = [
    {
      title: "Total Net Worth",
      value: formatCurrency(totalNetWorth),
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Family Net Worth",
      value: formatCurrency(familyNetWorth),
      icon: Users,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Company Liquidity",
      value: formatCurrency(companyLiquidity),
      icon: Building2,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Cash Runway",
      value: cashRunway ? `${cashRunway} months` : "N/A",
      icon: Activity,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>{card.title}</CardTitle>
            <div className={`rounded-lg p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{card.value}</div>
            <p className="mt-1 text-xs text-muted-foreground">Consolidated in SGD</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
