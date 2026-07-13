export type CurrencyCode = 'EUR' | 'COP' | 'USD';
export type CountryCode = 'DE' | 'CO';

export interface BudgetItem {
  id: string;
  budgetYear: number;
  budgetMonth: number;
  countryCode: CountryCode;
  currencyCode: CurrencyCode;
  name: string;
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number;
  dueDay: number | null;
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
  plannedAmount: number;
  actualAmount: number;
  dueDay: number | null;
  paid: boolean;
  paidDate: string | null;
  notes: string | null;
}
