export type AccountType =
  | 'BANK'
  | 'CASH'
  | 'CREDIT_CARD'
  | 'WALLET'
  | 'SAVINGS'
  | 'INVESTMENT'
  | 'OTHER';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalanceMinor: number;
  currentBalanceMinor: number;
  currency: string;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CategoryType = 'EXPENSE' | 'INCOME';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isArchived: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

export interface Transaction {
  id: string;
  type: TransactionType;
  amountMinor: number; // Stored in smallest unit (e.g. paise)
  accountId: string; // Source account (or only account for expense/income)
  destinationAccountId?: string; // Required if type is TRANSFER
  categoryId?: string; // Optional for transfer, required for expense/income
  date: string; // ISO format "YYYY-MM-DD"
  time?: string; // "HH:mm"
  note?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  monthKey: string; // "YYYY-MM"
  categoryId?: string | null; // null represents overall monthly budget
  limitMinor: number;
  createdAt: string;
  updatedAt: string;
}

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amountMinor: number;
  accountId: string;
  destinationAccountId?: string;
  categoryId?: string;
  note?: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextDueDate: string;
  isActive: boolean;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  reminderNotificationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilter {
  query?: string;
  type?: TransactionType | 'ALL';
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  tag?: string;
  minAmountMinor?: number;
  maxAmountMinor?: number;
}
