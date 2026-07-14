export type CurrencyCode = 'EUR' | 'COP' | 'USD';
export type CountryCode = 'DE' | 'CO';
export type BudgetItemType = 'EXPENSE' | 'DEBT_PAYMENT' | 'SAVINGS' | 'TRANSFER';

export interface BudgetItem {
  id: string;
  budgetYear: number;
  budgetMonth: number;
  countryCode: CountryCode;
  currencyCode: CurrencyCode;
  name: string;
  itemType: BudgetItemType;
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number;
  dueDay: number | null;
  dueDate: string | null;
  paid: boolean;
  paidDate: string | null;
  notes: string | null;
}

export interface BudgetItemRequest {
  budgetYear: number;
  budgetMonth: number;
  countryCode: CountryCode;
  currencyCode: CurrencyCode;
  name: string;
  itemType: BudgetItemType;
  plannedAmount: number;
  actualAmount: number;
  dueDay: number | null;
  dueDate: string | null;
  paid: boolean;
  paidDate: string | null;
  notes: string | null;
}

export interface BudgetSummary {
  id: string | null;
  budgetYear: number;
  budgetMonth: number;
  countryCode: CountryCode;
  currencyCode: CurrencyCode;
  incomeAmount: number;
  notes: string | null;
}

export interface BudgetSummaryRequest {
  budgetYear: number;
  budgetMonth: number;
  countryCode: CountryCode;
  currencyCode: CurrencyCode;
  incomeAmount: number;
  notes: string | null;
}
