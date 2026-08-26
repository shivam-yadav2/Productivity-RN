import { dbEngine } from '../db';
import { Transaction, TransactionFilter, TransactionType } from '../../types';
import { getCurrentTimeString, getTodayDateString } from '../../utils/date';

export const transactionRepository = {
  getAll(): Transaction[] {
    const db = dbEngine.getTables();
    return Object.values(db.transactions).sort((a, b) => {
      // Sort newest first by date then time/created
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      const timeB = b.time || '00:00';
      const timeA = a.time || '00:00';
      if (timeB !== timeA) return timeB.localeCompare(timeA);
      return b.createdAt.localeCompare(a.createdAt);
    });
  },

  getById(id: string): Transaction | undefined {
    return dbEngine.getTables().transactions[id];
  },

  /**
   * Search and filter transactions by date range, account, category, type, tags, and full text search.
   */
  filter(options: TransactionFilter): Transaction[] {
    let list = this.getAll();

    if (options.type && options.type !== 'ALL') {
      list = list.filter((t) => t.type === options.type);
    }

    if (options.accountId) {
      list = list.filter(
        (t) => t.accountId === options.accountId || t.destinationAccountId === options.accountId
      );
    }

    if (options.categoryId) {
      list = list.filter((t) => t.categoryId === options.categoryId);
    }

    if (options.startDate) {
      list = list.filter((t) => t.date >= options.startDate!);
    }

    if (options.endDate) {
      list = list.filter((t) => t.date <= options.endDate!);
    }

    if (options.tag) {
      list = list.filter((t) => t.tags && t.tags.includes(options.tag!));
    }

    if (options.minAmountMinor !== undefined) {
      list = list.filter((t) => t.amountMinor >= options.minAmountMinor!);
    }

    if (options.maxAmountMinor !== undefined) {
      list = list.filter((t) => t.amountMinor <= options.maxAmountMinor!);
    }

    if (options.query && options.query.trim()) {
      const q = options.query.toLowerCase().trim();
      const db = dbEngine.getTables();
      list = list.filter((t) => {
        const noteMatch = t.note?.toLowerCase().includes(q);
        const tagMatch = t.tags?.some((tag) => tag.toLowerCase().includes(q));
        const category = t.categoryId ? db.categories[t.categoryId] : undefined;
        const categoryMatch = category?.name.toLowerCase().includes(q);
        const account = db.accounts[t.accountId];
        const destAccount = t.destinationAccountId ? db.accounts[t.destinationAccountId] : undefined;
        const accountMatch = account?.name.toLowerCase().includes(q);
        const destAccountMatch = destAccount?.name.toLowerCase().includes(q);

        return noteMatch || tagMatch || categoryMatch || accountMatch || destAccountMatch;
      });
    }

    return list;
  },

  /**
   * Atomic Transaction creation (Rule 10).
   * Verifies accounts exist and updates balances atomically.
   */
  create(params: {
    type: TransactionType;
    amountMinor: number;
    accountId: string;
    destinationAccountId?: string;
    categoryId?: string;
    date?: string;
    time?: string;
    note?: string;
    tags?: string[];
  }): Transaction {
    if (params.amountMinor <= 0) {
      throw new Error('Transaction amount must be greater than zero.');
    }

    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const date = params.date || getTodayDateString();
    const time = params.time || getCurrentTimeString();

    const newTx: Transaction = {
      id,
      type: params.type,
      amountMinor: params.amountMinor,
      accountId: params.accountId,
      destinationAccountId: params.type === 'TRANSFER' ? params.destinationAccountId : undefined,
      categoryId: params.type !== 'TRANSFER' ? params.categoryId : undefined,
      date,
      time,
      note: params.note?.trim() || undefined,
      tags: params.tags && params.tags.length > 0 ? params.tags : undefined,
      createdAt: now,
      updatedAt: now,
    };

    dbEngine.runTransaction((db) => {
      // Validate source account
      const sourceAccount = db.accounts[params.accountId];
      if (!sourceAccount) {
        throw new Error(`Source account "${params.accountId}" not found.`);
      }

      if (params.type === 'TRANSFER') {
        if (!params.destinationAccountId) {
          throw new Error('Destination account is required for a transfer.');
        }
        if (params.accountId === params.destinationAccountId) {
          throw new Error('Source and destination accounts must be different.');
        }
        const destAccount = db.accounts[params.destinationAccountId];
        if (!destAccount) {
          throw new Error(`Destination account "${params.destinationAccountId}" not found.`);
        }
      }

      db.transactions[id] = newTx;
    });

    dbEngine.reconcileAllAccountBalances();
    return newTx;
  },

  /**
   * Atomic Transaction update (Rule 8 & 10).
   * Calculates delta and updates records atomically.
   */
  update(
    id: string,
    params: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ): Transaction {
    const existing = dbEngine.getTables().transactions[id];
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found.`);
    }

    const updated: Transaction = {
      ...existing,
      ...params,
      updatedAt: new Date().toISOString(),
    };

    if (updated.amountMinor <= 0) {
      throw new Error('Transaction amount must be greater than zero.');
    }

    dbEngine.runTransaction((db) => {
      db.transactions[id] = updated;
    });

    dbEngine.reconcileAllAccountBalances();
    return updated;
  },

  /**
   * Atomic Transaction deletion (Rule 7 & 10).
   * Reverses financial impact immediately.
   */
  delete(id: string): void {
    const existing = dbEngine.getTables().transactions[id];
    if (!existing) return;

    dbEngine.runTransaction((db) => {
      delete db.transactions[id];
    });

    dbEngine.reconcileAllAccountBalances();
  },
};
