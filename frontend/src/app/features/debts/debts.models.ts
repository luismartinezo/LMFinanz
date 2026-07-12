export type DebtStatus = 'ACTIVE' | 'PAID' | 'DEFAULTED' | 'CANCELLED';

export interface Debt {
  id: string;
  name: string;
  currencyCode: string;
  principalAmount: number;
  annualInterestRate: number;
  installments: number;
  startDate: string;
  finalDueDate: string;
  remainingBalance: number;
  status: DebtStatus;
}

export interface DebtRequest {
  name: string;
  currencyCode: string;
  principalAmount: number;
  annualInterestRate: number;
  installments: number;
  startDate: string;
  finalDueDate: string;
}
