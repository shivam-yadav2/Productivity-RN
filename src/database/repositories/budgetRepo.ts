import { dbEngine } from '../db';
import { Budget } from '../../types';
import { getMonthYearKey } from '../../utils/date';

export const budgetRepository = {
  getByMonth(monthKey = getMonthYearKey()): Budget[] {
    const db = dbEngine.getTables();
    return Object.values(db.budgets).filter((b) => b.monthKey === monthKey);
  },

  getOverallBudget(monthKey = getMonthYearKey()): Budget | undefined {
    const db = dbEngine.getTables();
    return Object.values(db.budgets).find(
      (b) => b.monthKey === monthKey && (b.categoryId === null || b.categoryId === undefined)
    );
  },

  getCategoryBudget(categoryId: string, monthKey = getMonthYearKey()): Budget | undefined {
    const db = dbEngine.getTables();
    return Object.values(db.budgets).find(
      (b) => b.monthKey === monthKey && b.categoryId === categoryId
    );
  },

  setBudget(params: {
    monthKey: string;
    categoryId?: string | null;
    limitMinor: number;
  }): Budget {
    const key = `budget_${params.categoryId || 'overall'}_${params.monthKey}`;
    const now = new Date().toISOString();
    const existing = dbEngine.getTables().budgets[key];

    const budget: Budget = {
      id: key,
      monthKey: params.monthKey,
      categoryId: params.categoryId || null,
      limitMinor: Math.max(0, params.limitMinor),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    dbEngine.runTransaction((db) => {
      db.budgets[key] = budget;
    });

    return budget;
  },

  deleteBudget(id: string): void {
    dbEngine.runTransaction((db) => {
      delete db.budgets[id];
    });
  },
};
