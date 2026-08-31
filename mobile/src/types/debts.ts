export interface Debt {
  id: string;
  name: string;
  lender?: string;
  icon: string;
  color: string;
  principalMinor: number;
  currentBalanceMinor: number;
  interestRatePercent?: number;
  emiAmountMinor?: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}
