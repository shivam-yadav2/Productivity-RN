import React, { useState } from 'react';
import { analyticsService, PeriodAnalytics } from '../../services/analyticsService';
import { useDatabase } from '../../context/DatabaseContext';
import { formatCurrency } from '../../utils/currency';
import { Card } from '../ui/Card';
import { IconHelper } from '../ui/IconHelper';
import { TrendingUp, TrendingDown, PiggyBank, Calendar, CreditCard, Award, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export const FinanceAnalyticsView: React.FC = () => {
  const { db } = useDatabase();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'last_month' | 'year' | 'all'>('month');

  const analytics = analyticsService.getAnalyticsForPeriod(period);
  const currency = db.settings.currency || 'INR';

  return (
    <div className="flex flex-col gap-4">
      {/* Period Selector Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 p-1 bg-[#F0F0EE] dark:bg-[#252523] rounded-md border border-[#E5E5E2] dark:border-[#333330]">
        {[
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'last_month', label: 'Last Month' },
          { key: 'year', label: 'This Year' },
          { key: 'all', label: 'All Time' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setPeriod(item.key as any)}
            className={cn(
              'px-3 py-1 text-xs font-semibold rounded shrink-0 transition-all cursor-pointer',
              period === item.key
                ? 'bg-white dark:bg-[#1A1A19] text-[#1A1A1A] dark:text-[#EDEDEB] shadow-2xs'
                : 'text-[#71716E] hover:text-[#1A1A1A] dark:hover:text-[#EDEDEB]'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Hero Financial Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income Card */}
        <div className="p-4 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg shadow-xs flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#71716E]">
            Total Income
          </span>
          <span className="text-xl font-light font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(analytics.totalIncomeMinor, currency)}
          </span>
        </div>

        {/* Expenses Card */}
        <div className="p-4 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg shadow-xs flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#71716E]">
            Total Expenses
          </span>
          <span className="text-xl font-light font-mono text-orange-600 dark:text-orange-400">
            {formatCurrency(analytics.totalExpenseMinor, currency)}
          </span>
        </div>
      </div>

      {/* Net Savings & Metrics */}
      <div className="flex flex-col gap-3 p-5 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg shadow-xs">
        <div className="flex items-center justify-between border-b border-[#F0F0EE] dark:border-[#2C2C29] pb-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
              Net Savings
            </span>
            <span
              className={cn(
                'text-2xl font-light font-mono mt-0.5',
                analytics.netSavingsMinor >= 0
                  ? 'text-[#1A1A1A] dark:text-[#EDEDEB]'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {analytics.netSavingsMinor >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(analytics.netSavingsMinor), currency)}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
              Savings Rate
            </span>
            <span className="text-2xl font-light text-[#1A1A1A] dark:text-[#EDEDEB] mt-0.5 font-mono">
              {analytics.savingsRatePercentage}%
            </span>
          </div>
        </div>

        {/* Secondary metric pills */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-3 bg-[#F9F9F8] dark:bg-[#252523] border border-[#E5E5E2] dark:border-[#333330] rounded-md flex flex-col gap-0.5">
            <span className="text-[10px] text-[#71716E] font-medium uppercase tracking-wider">Avg Daily Spend</span>
            <span className="font-medium font-mono text-[#1A1A1A] dark:text-[#EDEDEB] text-xs">
              {formatCurrency(analytics.avgDailyExpenseMinor, currency)}
            </span>
          </div>

          <div className="p-3 bg-[#F9F9F8] dark:bg-[#252523] border border-[#E5E5E2] dark:border-[#333330] rounded-md flex flex-col gap-0.5">
            <span className="text-[10px] text-[#71716E] font-medium uppercase tracking-wider">Largest Expense</span>
            <span className="font-medium font-mono text-[#1A1A1A] dark:text-[#EDEDEB] text-xs truncate">
              {analytics.largestTransaction
                ? formatCurrency(analytics.largestTransaction.amountMinor, currency)
                : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Spending By Category */}
      <div className="flex flex-col gap-3 p-5 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
            Spending by Category
          </span>
          <span className="text-xs text-[#71716E]">{analytics.categoryBreakdown.length} Categories</span>
        </div>

        {analytics.categoryBreakdown.length === 0 ? (
          <p className="text-xs text-[#71716E] py-3 text-center">No expense data in this period.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {analytics.categoryBreakdown.map((cat) => (
              <div key={cat.categoryId} className="flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: cat.categoryColor }}
                    >
                      <IconHelper name={cat.categoryIcon} size={12} />
                    </div>
                    <span className="font-medium text-[#1A1A1A] dark:text-[#EDEDEB]">
                      {cat.categoryName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[#71716E] text-[11px]">{cat.percentage}%</span>
                    <span className="font-mono font-medium text-[#1A1A1A] dark:text-[#EDEDEB]">
                      {formatCurrency(cat.totalMinor, currency)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-[#F0F0EE] dark:bg-[#333330] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(3, cat.percentage)}%`,
                      backgroundColor: cat.categoryColor,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spending By Account */}
      {analytics.accountBreakdown.length > 0 && (
        <div className="flex flex-col gap-3 p-5 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
            Spending by Account
          </span>
          <div className="flex flex-col gap-2">
            {analytics.accountBreakdown.map((acc) => (
              <div
                key={acc.accountId}
                className="flex items-center justify-between p-2.5 rounded-md bg-[#F9F9F8] dark:bg-[#252523] border border-[#E5E5E2] dark:border-[#333330] text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white"
                    style={{ backgroundColor: acc.accountColor }}
                  >
                    <IconHelper name={acc.accountIcon} size={13} />
                  </div>
                  <span className="font-medium text-[#1A1A1A] dark:text-[#EDEDEB]">
                    {acc.accountName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#71716E]">{acc.percentage}%</span>
                  <span className="font-mono font-medium text-[#1A1A1A] dark:text-[#EDEDEB]">
                    {formatCurrency(acc.totalMinor, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
