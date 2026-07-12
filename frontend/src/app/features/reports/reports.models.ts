export type ReportPeriod = 'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
export type ReportMode = 'SUMMARY' | 'CURRENCY' | 'COUNTRY';

export interface ReportBreakdownItem {
  label: string;
  currencyCode: string;
  countryCode: string;
  amount: number;
}

export interface FinancialReport {
  period: ReportPeriod;
  from: string;
  to: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  breakdown: ReportBreakdownItem[];
}

export interface ReportFilters {
  mode: ReportMode;
  period: ReportPeriod;
  from: string;
  to: string;
  currencyCode: string;
  countryCode: string;
}
