import { dbEngine } from '../db';
import { RecurringTransaction, TransactionType, RecurringFrequency } from '../../types';

export const recurringRepository = {
  getAll(activeOnly = true): RecurringTransaction[] {
    const db = dbEngine.getTables();
    return Object.values(db.recurringTransactions)
      .filter((r) => !activeOnly || r.isActive)
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  },

  getById(id: string): RecurringTransaction | undefined {
    return dbEngine.getTables().recurringTransactions[id];
  },

  create(params: {
    type: TransactionType;
    amountMinor: number;
    accountId: string;
    destinationAccountId?: string;
    categoryId?: string;
    note?: string;
    frequency: RecurringFrequency;
    startDate: string;
    nextDueDate: string;
  }): RecurringTransaction {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const recurring: RecurringTransaction = {
      id,
      type: params.type,
      amountMinor: params.amountMinor,
      accountId: params.accountId,
      destinationAccountId: params.destinationAccountId,
      categoryId: params.categoryId,
      note: params.note?.trim(),
      frequency: params.frequency,
      startDate: params.startDate,
      nextDueDate: params.nextDueDate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    dbEngine.runTransaction((db) => {
      db.recurringTransactions[id] = recurring;
    });

    return recurring;
  },

  update(
    id: string,
    params: Partial<Omit<RecurringTransaction, 'id' | 'createdAt'>>
  ): RecurringTransaction {
    const existing = dbEngine.getTables().recurringTransactions[id];
    if (!existing) {
      throw new Error(`Recurring transaction ${id} not found.`);
    }

    const updated: RecurringTransaction = {
      ...existing,
      ...params,
      updatedAt: new Date().toISOString(),
    };

    dbEngine.runTransaction((db) => {
      db.recurringTransactions[id] = updated;
    });

    return updated;
  },

  delete(id: string): void {
    dbEngine.runTransaction((db) => {
      delete db.recurringTransactions[id];
    });
  },
};
