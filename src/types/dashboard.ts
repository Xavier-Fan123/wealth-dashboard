export interface HoldingDetail {
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

export interface ManualAssetDetail {
  id: string;
  entity: string;
  name: string;
  balance: number;
  currency: string;
  category: string;
  valueSGD: number;
}

export interface BalanceItemDetail {
  id: string;
  entity: string;
  name: string;
  type: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  note: string | null;
  valueSGD: number;
}

export interface BalanceLine {
  name: string;
  value: number;
}

export interface BalanceSection {
  assets: BalanceLine[];
  liabilities: BalanceLine[];
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
}

export interface BalanceSheetData {
  asOf: string;
  family: BalanceSection;
  company: BalanceSection;
  consolidated: BalanceSection;
}

export interface MonthlyOutflow {
  month: string;
  label: string;
  amountSGD: number;
}

export interface AllocationSlice {
  name: string;
  value: number;
  color: string;
}

export interface TransactionRecord {
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
}

export interface CashMismatch {
  id: string;
  entity: string;
  name: string;
  currency: string;
  actual: number;
  expected: number;
  diff: number;
}

export interface HoldingMismatch {
  entity: string;
  ticker: string;
  expectedShares: number;
  actualShares: number;
  shareDiff: number;
  expectedAvgCost: number;
  actualAvgCost: number;
  avgCostDiff: number;
}

export interface ReconciliationData {
  checkedAt: string;
  status: "ok" | "warning";
  cashMismatches: CashMismatch[];
  holdingMismatches: HoldingMismatch[];
}

export interface QuoteInfo {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface FxRatesData {
  USDSGD: number;
  CNYSGD: number;
}

export interface DashboardData {
  totalNetWorth: number;
  familyNetWorth: number;
  companyLiquidity: number;
  companyCashBalance: number;
  companyCashCurrency: string;
  avgMonthlyBurn: number;
  cashRunway: number | null;
  companyMonthlyOutflow: MonthlyOutflow[];
  allocation: AllocationSlice[];
  balanceSheet: BalanceSheetData;
  balanceItems: BalanceItemDetail[];
  reconciliation: ReconciliationData;
  holdings: HoldingDetail[];
  manualAssets: ManualAssetDetail[];
  transactions: TransactionRecord[];
  fxRates: FxRatesData;
  quotes: Record<string, QuoteInfo>;
}
