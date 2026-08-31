import { dbEngine } from '../db';
import { Debt } from '../../types';

export const debtRepository = {
  getAll(): Debt[] {
    const db = dbEngine.getTables();
    return Object.values(db.debts).sort((a, b) => b.currentBalanceMinor - a.currentBalanceMinor);
  },

  getById(id: string): Debt | undefined {
    return dbEngine.getTables().debts[id];
  },

  create(params: {
    name: string;
    lender?: string;
    icon: string;
    color: string;
    principalMinor: number;
    currentBalanceMinor?: number;
    interestRatePercent?: number;
    emiAmountMinor?: number;
    dueDate?: string;
  }): Debt {
    const id = `debt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const debt: Debt = {
      id,
      name: params.name,
      lender: params.lender,
      icon: params.icon,
      color: params.color,
      principalMinor: Math.max(0, params.principalMinor),
      currentBalanceMinor: Math.max(0, params.currentBalanceMinor ?? params.principalMinor),
      interestRatePercent: params.interestRatePercent,
      emiAmountMinor: params.emiAmountMinor,
      dueDate: params.dueDate,
      createdAt: now,
      updatedAt: now,
    };

    dbEngine.runTransaction((db) => {
      db.debts[id] = debt;
    });

    return debt;
  },

  update(id: string, params: Partial<Omit<Debt, 'id' | 'createdAt'>>): Debt {
    const existing = dbEngine.getTables().debts[id];
    if (!existing) {
      throw new Error(`Debt ${id} not found.`);
    }

    const updated: Debt = {
      ...existing,
      ...params,
      updatedAt: new Date().toISOString(),
    };

    dbEngine.runTransaction((db) => {
      db.debts[id] = updated;
    });

    return updated;
  },

  recordPayment(id: string, amountMinor: number): Debt {
    const existing = dbEngine.getTables().debts[id];
    if (!existing) {
      throw new Error(`Debt ${id} not found.`);
    }

    const updated: Debt = {
      ...existing,
      currentBalanceMinor: Math.max(0, existing.currentBalanceMinor - amountMinor),
      updatedAt: new Date().toISOString(),
    };

    dbEngine.runTransaction((db) => {
      db.debts[id] = updated;
    });

    return updated;
  },

  delete(id: string): void {
    dbEngine.runTransaction((db) => {
      delete db.debts[id];
    });
  },
};
