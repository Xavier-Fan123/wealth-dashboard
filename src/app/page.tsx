"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { AllocationChart } from "@/components/dashboard/allocation-chart";
import { PortfolioTable } from "@/components/dashboard/portfolio-table";
import { CorporateBoard } from "@/components/dashboard/corporate-board";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { FxTicker } from "@/components/dashboard/fx-ticker";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Menu } from "lucide-react";

interface DashboardData {
  totalNetWorth: number;
  familyNetWorth: number;
  companyLiquidity: number;
  companyCashBalance: number;
  companyCashCurrency: string;
  avgMonthlyBurn: number;
  cashRunway: number | null;
  allocation: Array<{ name: string; value: number; color: string }>;
  holdings: Array<{
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
  }>;
  manualAssets: Array<{
    id: string;
    entity: string;
    name: string;
    balance: number;
    currency: string;
    category: string;
    valueSGD: number;
  }>;
  transactions: Array<{
    id: string;
    date: string;
    entity: string;
    asset: string;
    currency: string;
    amount: number;
    units: number | null;
    price: number | null;
    type: string;
    note: string | null;
  }>;
  fxRates: { USDSGD: number; CNYSGD: number };
  quotes: Record<string, { ticker: string; price: number; change: number; changePercent: number }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-destructive">Failed to load dashboard data. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 p-4 md:ml-64 md:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                {activeSection === "overview" && "Global Macro Overview"}
                {activeSection === "portfolio" && "Family Portfolio"}
                {activeSection === "corporate" && "Corporate Liquidity"}
                {activeSection === "transactions" && "Capital Flows"}
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Consolidated view across all entities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FxTicker
              fxRates={data.fxRates}
              lastUpdated={new Date().toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}
              onRefresh={fetchData}
              loading={loading}
            />
            <Button onClick={() => setShowTransactionForm(true)} className="shrink-0">
              <Plus className="mr-1 h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Log Transaction</span>
              <span className="sm:hidden">Log</span>
            </Button>
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            <KPICards
              totalNetWorth={data.totalNetWorth}
              familyNetWorth={data.familyNetWorth}
              companyLiquidity={data.companyLiquidity}
              cashRunway={data.cashRunway}
            />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <AllocationChart data={data.allocation} totalNetWorth={data.totalNetWorth} />
              <TransactionList transactions={data.transactions.slice(0, 8)} />
            </div>
            <PortfolioTable holdings={data.holdings} manualAssets={data.manualAssets} />
          </div>
        )}

        {/* Portfolio Section */}
        {activeSection === "portfolio" && (
          <div className="space-y-6">
            <PortfolioTable holdings={data.holdings} manualAssets={data.manualAssets} />
          </div>
        )}

        {/* Corporate Section */}
        {activeSection === "corporate" && (
          <CorporateBoard
            companyCashBalance={data.companyCashBalance}
            companyCashCurrency={data.companyCashCurrency}
            companyLiquidity={data.companyLiquidity}
            avgMonthlyBurn={data.avgMonthlyBurn}
            cashRunway={data.cashRunway}
            transactions={data.transactions}
          />
        )}

        {/* Transactions Section */}
        {activeSection === "transactions" && (
          <TransactionList transactions={data.transactions} />
        )}
      </main>

      <TransactionForm
        open={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSubmit={fetchData}
      />
    </div>
  );
}
