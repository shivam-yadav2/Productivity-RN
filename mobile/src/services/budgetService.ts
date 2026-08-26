import { budgetRepository } from '../database/repositories/budgetRepo';
import { transactionRepository } from '../database/repositories/transactionRepo';
import { categoryRepository } from '../database/repositories/categoryRepo';
import { getMonthYearKey } from '../utils/date';

export interface BudgetStatus {
  id: string;
  monthKey: string;
  categoryId?: string | null;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  limitMinor: number;
  spentMinor: number; // Excludes transfers
  remainingMinor: number;
  percentage: number;
  isOverBudget: boolean;
}

export const budgetService = {
  getMonthlyBudgetStatuses(monthKey = getMonthYearKey()): {
    overall?: BudgetStatus;
    categories: BudgetStatus[];
  } {
    const budgets = budgetRepository.getByMonth(monthKey);
    const startOfMonth = `${monthKey}-01`;
    const endOfMonth = `${monthKey}-31`;

    // Fetch transactions in this month (strictly type = EXPENSE, excluding TRANSFER)
    const monthExpenses = transactionRepository.filter({
      type: 'EXPENSE',
      startDate: startOfMonth,
      endDate: endOfMonth,
    });

    // Overall spending sum
    const totalMonthSpentMinor = monthExpenses.reduce((sum, tx) => sum + tx.amountMinor, 0);

    // Group spending by category
    const categorySpentMap: Record<string, number> = {};
    monthExpenses.forEach((tx) => {
      if (tx.categoryId) {
        categorySpentMap[tx.categoryId] = (categorySpentMap[tx.categoryId] || 0) + tx.amountMinor;
      }
    });

    let overallStatus: BudgetStatus | undefined;
    const categoryStatuses: BudgetStatus[] = [];

    budgets.forEach((b) => {
      if (!b.categoryId) {
        // Overall monthly budget
        const spent = totalMonthSpentMinor;
        const remaining = b.limitMinor - spent;
        const percentage = b.limitMinor > 0 ? Math.round((spent / b.limitMinor) * 100) : 0;
        overallStatus = {
          id: b.id,
          monthKey: b.monthKey,
          categoryId: null,
          categoryName: 'Total Monthly Budget',
          categoryIcon: 'PiggyBank',
          categoryColor: '#3b82f6',
          limitMinor: b.limitMinor,
          spentMinor: spent,
          remainingMinor: remaining,
          percentage,
          isOverBudget: spent > b.limitMinor,
        };
      } else {
        const cat = categoryRepository.getById(b.categoryId);
        const spent = categorySpentMap[b.categoryId] || 0;
        const remaining = b.limitMinor - spent;
        const percentage = b.limitMinor > 0 ? Math.round((spent / b.limitMinor) * 100) : 0;

        categoryStatuses.push({
          id: b.id,
          monthKey: b.monthKey,
          categoryId: b.categoryId,
          categoryName: cat?.name || 'Category',
          categoryIcon: cat?.icon || 'Tag',
          categoryColor: cat?.color || '#64748b',
          limitMinor: b.limitMinor,
          spentMinor: spent,
          remainingMinor: remaining,
          percentage,
          isOverBudget: spent > b.limitMinor,
        });
      }
    });

    // Sort category budgets by highest % spent
    categoryStatuses.sort((a, b) => b.percentage - a.percentage);

    return {
      overall: overallStatus,
      categories: categoryStatuses,
    };
  },
};
