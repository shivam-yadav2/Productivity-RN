import { transactionRepository } from '../database/repositories/transactionRepo';
import { categoryRepository } from '../database/repositories/categoryRepo';
import { accountRepository } from '../database/repositories/accountRepo';
import { getDateRangeForPeriod, DateRange } from '../utils/date';
import { Transaction } from '../types';

export interface CategorySpendingBreakdown {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalMinor: number;
  percentage: number;
  count: number;
}

export interface AccountSpendingBreakdown {
  accountId: string;
  accountName: string;
  accountType: string;
  accountIcon: string;
  accountColor: string;
  totalMinor: number;
  percentage: number;
}

export interface PeriodAnalytics {
  period: string;
  dateRange: DateRange;
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  netSavingsMinor: number;
  savingsRatePercentage: number;
  avgDailyExpenseMinor: number;
  highestCategory?: CategorySpendingBreakdown;
  largestTransaction?: Transaction;
  categoryBreakdown: CategorySpendingBreakdown[];
  accountBreakdown: AccountSpendingBreakdown[];
  dailyTrend: { date: string; displayDate: string; incomeMinor: number; expenseMinor: number }[];
}

export const analyticsService = {
  getAnalyticsForPeriod(
    periodKey: 'today' | 'week' | 'month' | 'last_month' | 'year' | 'all'
  ): PeriodAnalytics {
    const range = getDateRangeForPeriod(periodKey);
    const transactions = transactionRepository.filter({
      startDate: range.startDate,
      endDate: range.endDate,
    });

    let totalIncomeMinor = 0;
    let totalExpenseMinor = 0;
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    const accountTotals: Record<string, number> = {};
    const dailyMap: Record<string, { income: number; expense: number }> = {};
    let largestTx: Transaction | undefined;

    transactions.forEach((tx) => {
      // Daily map init
      if (!dailyMap[tx.date]) {
        dailyMap[tx.date] = { income: 0, expense: 0 };
      }

      if (tx.type === 'INCOME') {
        totalIncomeMinor += tx.amountMinor;
        dailyMap[tx.date].income += tx.amountMinor;
      } else if (tx.type === 'EXPENSE') {
        totalExpenseMinor += tx.amountMinor;
        dailyMap[tx.date].expense += tx.amountMinor;

        if (tx.categoryId) {
          if (!categoryTotals[tx.categoryId]) {
            categoryTotals[tx.categoryId] = { total: 0, count: 0 };
          }
          categoryTotals[tx.categoryId].total += tx.amountMinor;
          categoryTotals[tx.categoryId].count += 1;
        }

        accountTotals[tx.accountId] = (accountTotals[tx.accountId] || 0) + tx.amountMinor;

        if (!largestTx || tx.amountMinor > largestTx.amountMinor) {
          largestTx = tx;
        }
      }
      // Note: Transfers do not impact income or expense totals (Invariants 4 & 5)
    });

    const netSavingsMinor = totalIncomeMinor - totalExpenseMinor;
    const savingsRatePercentage =
      totalIncomeMinor > 0 ? Math.max(0, Math.round((netSavingsMinor / totalIncomeMinor) * 100)) : 0;

    // Calculate number of active days in period
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const avgDailyExpenseMinor = Math.round(totalExpenseMinor / diffDays);

    // Build category breakdown
    const categoryBreakdown: CategorySpendingBreakdown[] = Object.keys(categoryTotals)
      .map((catId) => {
        const cat = categoryRepository.getById(catId);
        const { total, count } = categoryTotals[catId];
        const percentage = totalExpenseMinor > 0 ? Math.round((total / totalExpenseMinor) * 100) : 0;
        return {
          categoryId: catId,
          categoryName: cat?.name || 'Other',
          categoryIcon: cat?.icon || 'Tag',
          categoryColor: cat?.color || '#64748b',
          totalMinor: total,
          percentage,
          count,
        };
      })
      .sort((a, b) => b.totalMinor - a.totalMinor);

    // Build account breakdown
    const accountBreakdown: AccountSpendingBreakdown[] = Object.keys(accountTotals)
      .map((accId) => {
        const acc = accountRepository.getById(accId);
        const total = accountTotals[accId];
        const percentage = totalExpenseMinor > 0 ? Math.round((total / totalExpenseMinor) * 100) : 0;
        return {
          accountId: accId,
          accountName: acc?.name || 'Account',
          accountType: acc?.type || 'BANK',
          accountIcon: acc?.icon || 'Landmark',
          accountColor: acc?.color || '#2563eb',
          totalMinor: total,
          percentage,
        };
      })
      .sort((a, b) => b.totalMinor - a.totalMinor);

    // Daily trend array
    const sortedDates = Object.keys(dailyMap).sort();
    const dailyTrend = sortedDates.map((d) => {
      const parts = d.split('-');
      const displayDate = `${parts[2]}/${parts[1]}`;
      return {
        date: d,
        displayDate,
        incomeMinor: dailyMap[d].income,
        expenseMinor: dailyMap[d].expense,
      };
    });

    return {
      period: range.label,
      dateRange: range,
      totalIncomeMinor,
      totalExpenseMinor,
      netSavingsMinor,
      savingsRatePercentage,
      avgDailyExpenseMinor,
      highestCategory: categoryBreakdown[0],
      largestTransaction: largestTx,
      categoryBreakdown,
      accountBreakdown,
      dailyTrend,
    };
  },
};
