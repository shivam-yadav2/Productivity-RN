import { Account, Category, AppSettings } from '../types';

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_sbi_default',
    name: 'SBI Bank',
    type: 'BANK',
    openingBalanceMinor: 4500000, // ₹45,000.00
    currentBalanceMinor: 4500000,
    currency: 'INR',
    icon: 'Building2',
    color: '#2563eb', // blue
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc_cash_default',
    name: 'Cash Wallet',
    type: 'CASH',
    openingBalanceMinor: 320000, // ₹3,200.00
    currentBalanceMinor: 320000,
    currency: 'INR',
    icon: 'Banknote',
    color: '#059669', // emerald
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc_hdfc_default',
    name: 'HDFC Savings',
    type: 'SAVINGS',
    openingBalanceMinor: 2000000, // ₹20,000.00
    currentBalanceMinor: 2000000,
    currency: 'INR',
    icon: 'Landmark',
    color: '#4f46e5', // indigo
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  {
    id: 'cat_exp_food',
    name: 'Food & Dining',
    type: 'EXPENSE',
    icon: 'Utensils',
    color: '#f97316', // orange
    isArchived: false,
    isDefault: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_groceries',
    name: 'Groceries',
    type: 'EXPENSE',
    icon: 'ShoppingCart',
    color: '#10b981', // emerald
    isArchived: false,
    isDefault: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_travel',
    name: 'Travel & Commute',
    type: 'EXPENSE',
    icon: 'Car',
    color: '#3b82f6', // blue
    isArchived: false,
    isDefault: true,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_shopping',
    name: 'Shopping',
    type: 'EXPENSE',
    icon: 'ShoppingBag',
    color: '#ec4899', // pink
    isArchived: false,
    isDefault: true,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_bills',
    name: 'Bills & Utilities',
    type: 'EXPENSE',
    icon: 'Receipt',
    color: '#8b5cf6', // purple
    isArchived: false,
    isDefault: true,
    sortOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_rent',
    name: 'Rent & Housing',
    type: 'EXPENSE',
    icon: 'Home',
    color: '#6366f1', // indigo
    isArchived: false,
    isDefault: true,
    sortOrder: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_healthcare',
    name: 'Healthcare & Meds',
    type: 'EXPENSE',
    icon: 'HeartPulse',
    color: '#ef4444', // red
    isArchived: false,
    isDefault: true,
    sortOrder: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_education',
    name: 'Education & Courses',
    type: 'EXPENSE',
    icon: 'GraduationCap',
    color: '#14b8a6', // teal
    isArchived: false,
    isDefault: true,
    sortOrder: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_entertainment',
    name: 'Entertainment',
    type: 'EXPENSE',
    icon: 'Film',
    color: '#a855f7', // purple
    isArchived: false,
    isDefault: true,
    sortOrder: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_fuel',
    name: 'Fuel',
    type: 'EXPENSE',
    icon: 'Fuel',
    color: '#eab308', // yellow
    isArchived: false,
    isDefault: true,
    sortOrder: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_subscriptions',
    name: 'Subscriptions & OTT',
    type: 'EXPENSE',
    icon: 'Tv',
    color: '#06b6d4', // cyan
    isArchived: false,
    isDefault: true,
    sortOrder: 11,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_personal_care',
    name: 'Personal Care',
    type: 'EXPENSE',
    icon: 'Sparkles',
    color: '#f43f5e', // rose
    isArchived: false,
    isDefault: true,
    sortOrder: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_gifts',
    name: 'Gifts & Donations',
    type: 'EXPENSE',
    icon: 'Gift',
    color: '#d946ef', // fuchsia
    isArchived: false,
    isDefault: true,
    sortOrder: 13,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_exp_other',
    name: 'Other Expense',
    type: 'EXPENSE',
    icon: 'CircleDot',
    color: '#64748b', // slate
    isArchived: false,
    isDefault: true,
    sortOrder: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  {
    id: 'cat_inc_salary',
    name: 'Salary',
    type: 'INCOME',
    icon: 'Briefcase',
    color: '#059669', // emerald
    isArchived: false,
    isDefault: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_inc_freelance',
    name: 'Freelance & Consulting',
    type: 'INCOME',
    icon: 'Laptop',
    color: '#0d9488', // teal
    isArchived: false,
    isDefault: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_inc_bonus',
    name: 'Bonus & Incentives',
    type: 'INCOME',
    icon: 'Trophy',
    color: '#d97706', // amber
    isArchived: false,
    isDefault: true,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_inc_business',
    name: 'Business Revenue',
    type: 'INCOME',
    icon: 'TrendingUp',
    color: '#2563eb', // blue
    isArchived: false,
    isDefault: true,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_inc_interest',
    name: 'Interest & Dividends',
    type: 'INCOME',
    icon: 'PiggyBank',
    color: '#8b5cf6', // purple
    isArchived: false,
    isDefault: true,
    sortOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_inc_refund',
    name: 'Refund & Cashback',
    type: 'INCOME',
    icon: 'RotateCcw',
    color: '#0284c7', // sky
    isArchived: false,
    isDefault: true,
    sortOrder: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat_inc_other',
    name: 'Other Income',
    type: 'INCOME',
    icon: 'Coins',
    color: '#64748b', // slate
    isArchived: false,
    isDefault: true,
    sortOrder: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'INR',
  theme: 'light',
  securityType: 'NONE',
  pinHash: undefined,
  autoLockMinutes: 5,
  defaultAccountId: 'acc_sbi_default',
  soundEnabled: true,
  hapticEnabled: true,
  hasCompletedOnboarding: false,
  focusSettings: {
    focusDurationMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    soundEnabled: true,
    vibrationEnabled: true,
  },
  appVersion: '1.0.0',
};
