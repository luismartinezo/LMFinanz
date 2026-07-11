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
  error: string | null;
}
