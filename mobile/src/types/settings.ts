import { FocusSettings } from './productivity';

export type AppTheme = 'light' | 'dark' | 'system';
export type SecurityType = 'NONE' | 'PIN' | 'BIOMETRIC';

export interface AppSettings {
  currency: string;
  theme: AppTheme;
  securityType: SecurityType;
  pinHash?: string;
  autoLockMinutes: number;
  defaultAccountId?: string;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  hapticsEnabled?: boolean;
  biometricsEnabled?: boolean;
  pomodoroFocusDuration?: number;
  pomodoroBreakDuration?: number;
  pomodoroLongBreakDuration?: number;
  hasCompletedOnboarding: boolean;
  focusSettings: FocusSettings;
  appVersion: string;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  metadata: {
    appName: string;
    version: string;
    device: string;
  };
  data: {
    accounts: any[];
    categories: any[];
    transactions: any[];
    budgets: any[];
    recurringTransactions: any[];
    tasks: any[];
    habits: any[];
    habitLogs: any[];
    focusSessions: any[];
    savingsGoals: any[];
    debts: any[];
    notes: any[];
    settings: AppSettings;
  };
}
