export interface FinancialReport {
  period: 'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  from: string;
  to: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  breakdown: ReportBreakdownItem[];
}

export interface ReportBreakdownItem {
  label: string;
  currencyCode: string;
  countryCode: string;
  amount: number;
}

export interface DashboardState {
  loading: boolean;
  report: FinancialReport | null;
  accounts: DashboardAccount[];
  debts: DashboardDebt[];
  savingsGoals: DashboardSavingsGoal[];
  assets: DashboardAsset[];
  error: string | null;
}

export interface DashboardAccount {
  currencyCode: string;
  countryCode: string;
  currentBalance: number;
  active: boolean;
}

export interface DashboardDebt {
  currencyCode: string;
  remainingBalance: number;
  status: string;
}

export interface DashboardSavingsGoal {
  currencyCode: string;
  currentAmount: number;
  targetAmount: number;
  status: string;
}

export interface DashboardAsset {
  currencyCode: string;
  estimatedValue: number;
  active: boolean;
}
