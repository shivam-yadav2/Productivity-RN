import { dbEngine } from '../db';
import { SavingsGoal } from '../../types';

export const goalRepository = {
  getAll(): SavingsGoal[] {
    const db = dbEngine.getTables();
    return Object.values(db.savingsGoals).sort((a, b) => {
      const aDone = a.savedAmountMinor >= a.targetAmountMinor;
      const bDone = b.savedAmountMinor >= b.targetAmountMinor;
      if (aDone !== bDone) return aDone ? 1 : -1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  },

  getById(id: string): SavingsGoal | undefined {
    return dbEngine.getTables().savingsGoals[id];
  },

  create(params: {
    name: string;
    icon: string;
    color: string;
    targetAmountMinor: number;
    savedAmountMinor?: number;
    targetDate?: string;
  }): SavingsGoal {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const goal: SavingsGoal = {
      id,
      name: params.name,
      icon: params.icon,
      color: params.color,
      targetAmountMinor: Math.max(0, params.targetAmountMinor),
      savedAmountMinor: Math.max(0, params.savedAmountMinor || 0),
      targetDate: params.targetDate,
      createdAt: now,
      updatedAt: now,
    };

    dbEngine.runTransaction((db) => {
      db.savingsGoals[id] = goal;
    });

    return goal;
  },

  update(id: string, params: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>): SavingsGoal {
    const existing = dbEngine.getTables().savingsGoals[id];
    if (!existing) {
      throw new Error(`Savings goal ${id} not found.`);
    }

    const updated: SavingsGoal = {
      ...existing,
      ...params,
      updatedAt: new Date().toISOString(),
    };

    dbEngine.runTransaction((db) => {
      db.savingsGoals[id] = updated;
    });

    return updated;
  },

  addContribution(id: string, amountMinor: number): SavingsGoal {
    const existing = dbEngine.getTables().savingsGoals[id];
    if (!existing) {
      throw new Error(`Savings goal ${id} not found.`);
    }

    const updated: SavingsGoal = {
      ...existing,
      savedAmountMinor: existing.savedAmountMinor + amountMinor,
      updatedAt: new Date().toISOString(),
    };

    dbEngine.runTransaction((db) => {
      db.savingsGoals[id] = updated;
    });

    return updated;
  },

  delete(id: string): void {
    dbEngine.runTransaction((db) => {
      delete db.savingsGoals[id];
    });
  },
};
