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
  incomeSummaries: DashboardBudgetSummary[];
  accounts: DashboardAccount[];
  debts: DashboardDebt[];
  savingsGoals: DashboardSavingsGoal[];
  assets: DashboardAsset[];
  transactions: DashboardTransaction[];
  error: string | null;
}

export interface DashboardBudgetSummary {
  id: string | null;
  budgetYear: number;
  budgetMonth: number;
  countryCode: string;
  currencyCode: string;
  incomeAmount: number;
  notes: string | null;
}

export interface DashboardAccount {
  type: 'BANK_ACCOUNT' | 'CASH_ACCOUNT' | 'CREDIT_CARD';
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

export interface DashboardTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  currencyCode: string;
  countryCode: string;
  amount: number;
  transactionDate: string;
  description: string | null;
  status: string;
}
