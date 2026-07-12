export type DebtStatus = 'ACTIVE' | 'PAID' | 'DEFAULTED' | 'CANCELLED';
export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

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

export interface DebtInstallment {
  id: string;
  debtId: string;
  installmentNumber: number;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  dueDate: string;
  paidDate: string | null;
  paymentTransactionId: string | null;
  status: InstallmentStatus;
}

export interface DebtInstallmentPaymentRequest {
  paidDate: string;
  paymentTransactionId: string | null;
}
