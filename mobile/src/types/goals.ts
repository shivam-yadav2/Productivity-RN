export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmountMinor: number;
  savedAmountMinor: number;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}
