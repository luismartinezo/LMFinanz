export type DebtStatus = 'ACTIVE' | 'PAID' | 'DEFAULTED' | 'CANCELLED';
export type DebtType = 'CREDIT_CARD' | 'MORTGAGE' | 'PERSONAL_LOAN' | 'VEHICLE_LOAN' | 'INSTALLMENT_PURCHASE' | 'FAMILY_LOAN' | 'OTHER';
export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface Debt {
  id: string;
  name: string;
  debtType: DebtType;
  currencyCode: string;
  countryCode: string;
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
  debtType: DebtType;
  currencyCode: string;
  countryCode: string;
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
