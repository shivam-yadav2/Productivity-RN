import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { dbEngine } from '../database/db';
import { BackupData } from '../types';
import { toMajorUnits } from '../utils/currency';
import { getTodayDateString } from '../utils/date';

async function writeAndShare(filename: string, content: string, mimeType: string): Promise<void> {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: filename });
  }
}

export const backupService = {
  exportFullBackup(): string {
    const db = dbEngine.getTables();
    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      metadata: {
        appName: 'Personal Productivity & Finance Ledger',
        version: '1.0.0',
        device: `${Platform.OS} ${Platform.Version}`,
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

  async downloadBackupFile(): Promise<void> {
    const jsonStr = this.exportFullBackup();
    await writeAndShare(`ppf_backup_${getTodayDateString()}.json`, jsonStr, 'application/json');
  },

  async exportJSON(): Promise<void> {
    await this.downloadBackupFile();
  },

  async exportTransactionsCSV(): Promise<void> {
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
    await writeAndShare(`transactions_export_${getTodayDateString()}.csv`, csvContent, 'text/csv');
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

  /** Opens the native file picker for a JSON backup, reads it, and restores it. */
  async pickAndImportBackup(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) {
        return { success: false, message: 'No file selected.' };
      }
      const file = new File(result.assets[0].uri);
      const jsonString = await file.text();
      return this.importBackupJSON(jsonString);
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to read backup file.' };
    }
  },

  resetDatabase(): void {
    dbEngine.resetToFactoryDefaults();
  },
};
