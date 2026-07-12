export type SavingsGoalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface SavingsGoal {
  id: string;
  name: string;
  currencyCode: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: SavingsGoalStatus;
}

export interface SavingsGoalRequest {
  name: string;
  currencyCode: string;
  targetAmount: number;
  deadline: string;
}

export interface SavingsContributionRequest {
  transactionId?: string | null;
  amount: number;
  contributionDate: string;
}
