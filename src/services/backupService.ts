import { dbEngine } from '../database/db';
import { BackupData } from '../types';
import { toMajorUnits } from '../utils/currency';
import { getTodayDateString } from '../utils/date';

export const backupService = {
  exportFullBackup(): string {
    const db = dbEngine.getTables();
    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      metadata: {
        appName: 'Personal Productivity & Finance Ledger',
        version: '1.0.0',
        device: typeof navigator !== 'undefined' ? navigator.userAgent : 'offline-browser',
      },
      data: {
        accounts: Object.values(db.accounts),
        categories: Object.values(db.categories),
        transactions: Object.values(db.transactions),
        budgets: Object.values(db.budgets),
        recurringTransactions: Object.values(db.recurringTransactions),
        tasks: Object.values(db.tasks),
        habits: Object.values(db.habits),
        habitLogs: Object.values(db.habitLogs),
        focusSessions: Object.values(db.focusSessions),
        settings: db.settings,
      },
    };

    return JSON.stringify(backup, null, 2);
  },

  downloadBackupFile(): void {
    const jsonStr = this.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ppf_backup_${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportJSON(): void {
    this.downloadBackupFile();
  },

  exportTransactionsCSV(): void {
    const db = dbEngine.getTables();
    const transactions = Object.values(db.transactions).sort((a, b) => b.date.localeCompare(a.date));

    const headers = [
      'ID',
      'Date',
      'Time',
      'Type',
      'Category',
      'Source Account',
      'Destination Account',
      'Amount',
      'Note',
      'Tags',
      'Created At',
    ];

    const rows = transactions.map((t) => {
      const cat = t.categoryId ? db.categories[t.categoryId]?.name || '' : '';
      const srcAcc = db.accounts[t.accountId]?.name || t.accountId;
      const destAcc = t.destinationAccountId ? db.accounts[t.destinationAccountId]?.name || t.destinationAccountId : '';
      const amount = toMajorUnits(t.amountMinor).toFixed(2);
      const tags = (t.tags || []).join(';');
      const note = (t.note || '').replace(/"/g, '""');

      return [
        t.id,
        t.date,
        t.time || '',
        t.type,
        `"${cat}"`,
        `"${srcAcc}"`,
        `"${destAcc}"`,
        amount,
        `"${note}"`,
        `"${tags}"`,
        t.createdAt,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_export_${getTodayDateString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importBackupJSON(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);

      // Validate schema
      if (!parsed || !parsed.version || !parsed.data) {
        throw new Error('Invalid backup file: Missing version or data object.');
      }

      if (!Array.isArray(parsed.data.accounts) || !Array.isArray(parsed.data.transactions)) {
        throw new Error('Invalid backup schema: Accounts and transactions arrays are required.');
      }

      dbEngine.restoreFromBackup(parsed as BackupData);
      return { success: true, message: 'Backup successfully restored with full integrity.' };
    } catch (error: any) {
      console.error('Failed to import backup:', error);
      return {
        success: false,
        message: error?.message || 'Failed to parse and import backup file.',
      };
    }
  },

  importJSON(jsonString: string): { success: boolean; message: string } {
    return this.importBackupJSON(jsonString);
  },

  resetDatabase(): void {
    dbEngine.resetToFactoryDefaults();
  },
};
