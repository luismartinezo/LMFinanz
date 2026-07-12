export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export interface Transaction {
  id: string;
  type: TransactionType;
  sourceAccountId: string | null;
  targetAccountId: string | null;
  categoryId: string | null;
  currencyCode: string;
  countryCode: string;
  amount: number;
  transactionDate: string;
  description: string | null;
  status: TransactionStatus;
}

export interface TransactionRequest {
  type: TransactionType;
  sourceAccountId: string | null;
  targetAccountId: string | null;
  categoryId: string | null;
  currencyCode: string;
  countryCode: string;
  amount: number;
  transactionDate: string;
  description: string | null;
}
