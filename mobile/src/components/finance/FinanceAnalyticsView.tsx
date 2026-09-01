import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { analyticsService } from '../../services/analyticsService';
import { useDatabase } from '../../context/DatabaseContext';
import { formatCurrency } from '../../utils/currency';
import { IconHelper } from '../ui/IconHelper';
import { AnimatedBar } from '../ui/AnimatedBar';
import { FadeSwap } from '../ui/FadeSwap';
import { cn } from '../../utils/cn';

type Period = 'today' | 'week' | 'month' | 'last_month' | 'year' | 'all';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

export const FinanceAnalyticsView: React.FC = () => {
  const { db } = useDatabase();
  const [period, setPeriod] = useState<Period>('month');

  const analytics = analyticsService.getAnalyticsForPeriod(period);
  const currency = db.settings.currency || 'INR';

  return (
    <View className="flex-col gap-4">
      {/* Period Selector Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="p-1 bg-ink-100 dark:bg-ink-800 rounded-md border border-ink-200 dark:border-ink-700"
      >
        <View className="flex-row items-center gap-1">
          {PERIODS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setPeriod(item.key)}
              className={cn(
                'px-3 py-1 rounded',
                period === item.key && 'bg-surface dark:bg-surface-dark'
              )}
            >
              <Text
                className={cn(
                  'text-xs font-semibold',
                  period === item.key ? 'text-ink-900 dark:text-ink-100' : 'text-ink-500'
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <FadeSwap swapKey={period}>
      <View className="flex-col gap-4">
      {/* Hero Financial Summary Cards */}
      <View className="flex-row gap-3">
        {/* Income Card */}
        <View className="flex-1 p-4 bg-surface dark:bg-surface-dark border border-ink-200 dark:border-ink-800 rounded-lg flex-col gap-1">
          <Text className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Total Income</Text>
          <Text className="text-xl font-light text-emerald-600 dark:text-emerald-400">
            {formatCurrency(analytics.totalIncomeMinor, currency)}
          </Text>
        </View>

        {/* Expenses Card */}
        <View className="flex-1 p-4 bg-surface dark:bg-surface-dark border border-ink-200 dark:border-ink-800 rounded-lg flex-col gap-1">
          <Text className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Total Expenses</Text>
          <Text className="text-xl font-light text-orange-600 dark:text-orange-400">
            {formatCurrency(analytics.totalExpenseMinor, currency)}
          </Text>
        </View>
      </View>

      {/* Net Savings & Metrics */}
      <View className="flex-col gap-3 p-5 bg-surface dark:bg-surface-dark border border-ink-200 dark:border-ink-800 rounded-lg">
        <View className="flex-row items-center justify-between border-b border-ink-100 dark:border-ink-800 pb-3">
          <View className="flex-col">
            <Text className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
              Net Savings
            </Text>
            <Text
              className={cn(
                'text-2xl font-light mt-0.5',
                analytics.netSavingsMinor >= 0
                  ? 'text-ink-900 dark:text-ink-100'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {analytics.netSavingsMinor >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(analytics.netSavingsMinor), currency)}
            </Text>
          </View>

          <View className="flex-col items-end">
            <Text className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
              Savings Rate
            </Text>
            <Text className="text-2xl font-light text-ink-900 dark:text-ink-100 mt-0.5">
              {analytics.savingsRatePercentage}%
            </Text>
          </View>
        </View>

        {/* Secondary metric pills */}
        <View className="flex-row gap-2 pt-1">
          <View className="flex-1 p-3 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-md flex-col gap-0.5">
            <Text className="text-[10px] text-ink-500 font-medium uppercase tracking-wider">Avg Daily Spend</Text>
            <Text className="font-medium text-ink-900 dark:text-ink-100 text-xs">
              {formatCurrency(analytics.avgDailyExpenseMinor, currency)}
            </Text>
          </View>

          <View className="flex-1 p-3 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-md flex-col gap-0.5">
            <Text className="text-[10px] text-ink-500 font-medium uppercase tracking-wider">Largest Expense</Text>
            <Text numberOfLines={1} className="font-medium text-ink-900 dark:text-ink-100 text-xs">
              {analytics.largestTransaction
                ? formatCurrency(analytics.largestTransaction.amountMinor, currency)
                : 'None'}
            </Text>
          </View>
        </View>
      </View>

      {/* Spending By Category */}
      <View className="flex-col gap-3 p-5 bg-surface dark:bg-surface-dark border border-ink-200 dark:border-ink-800 rounded-lg">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
            Spending by Category
          </Text>
          <Text className="text-xs text-ink-500">{analytics.categoryBreakdown.length} Categories</Text>
        </View>

        {analytics.categoryBreakdown.length === 0 ? (
          <Text className="text-xs text-ink-500 py-3 text-center">No expense data in this period.</Text>
        ) : (
          <View className="flex-col gap-3">
            {analytics.categoryBreakdown.map((cat, idx) => (
              <View key={cat.categoryId} className="flex-col gap-1">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2 flex-1 min-w-0 pr-2">
                    <View
                      className="w-5 h-5 rounded-md items-center justify-center"
                      style={{ backgroundColor: cat.categoryColor }}
                    >
                      <IconHelper name={cat.categoryIcon} size={12} color="#ffffff" />
                    </View>
                    <Text numberOfLines={1} className="text-xs font-medium text-ink-900 dark:text-ink-100">
                      {cat.categoryName}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2 shrink-0">
                    <Text className="text-ink-500 text-[11px]">{cat.percentage}%</Text>
                    <Text className="text-xs font-medium text-ink-900 dark:text-ink-100">
                      {formatCurrency(cat.totalMinor, currency)}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <AnimatedBar
                  percent={Math.max(3, cat.percentage)}
                  delay={idx * 45}
                  trackClassName="h-1 bg-ink-100 dark:bg-ink-700 rounded-full"
                  fillColor={cat.categoryColor}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Spending By Account */}
      {analytics.accountBreakdown.length > 0 && (
        <View className="flex-col gap-3 p-5 bg-surface dark:bg-surface-dark border border-ink-200 dark:border-ink-800 rounded-lg">
          <Text className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
            Spending by Account
          </Text>
          <View className="flex-col gap-2">
            {analytics.accountBreakdown.map((acc) => (
              <View
                key={acc.accountId}
                className="flex-row items-center justify-between p-2.5 rounded-md bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700"
              >
                <View className="flex-row items-center gap-2 flex-1 min-w-0 pr-2">
                  <View
                    className="w-6 h-6 rounded-md items-center justify-center"
                    style={{ backgroundColor: acc.accountColor }}
                  >
                    <IconHelper name={acc.accountIcon} size={13} color="#ffffff" />
                  </View>
                  <Text numberOfLines={1} className="text-xs font-medium text-ink-900 dark:text-ink-100">
                    {acc.accountName}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2 shrink-0">
                  <Text className="text-[11px] text-ink-500">{acc.percentage}%</Text>
                  <Text className="text-xs font-medium text-ink-900 dark:text-ink-100">
                    {formatCurrency(acc.totalMinor, currency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      </View>
      </FadeSwap>
    </View>
  );
};
