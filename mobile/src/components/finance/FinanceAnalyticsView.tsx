import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { analyticsService } from '../../services/analyticsService';
import { useDatabase } from '../../context/DatabaseContext';
import { formatCurrency } from '../../utils/currency';
import { IconHelper } from '../ui/IconHelper';
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
        className="p-1 bg-[#F0F0EE] dark:bg-[#252523] rounded-md border border-[#E5E5E2] dark:border-[#333330]"
      >
        <View className="flex-row items-center gap-1">
          {PERIODS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setPeriod(item.key)}
              className={cn(
                'px-3 py-1 rounded',
                period === item.key && 'bg-white dark:bg-[#1A1A19]'
              )}
            >
              <Text
                className={cn(
                  'text-xs font-semibold',
                  period === item.key ? 'text-[#1A1A1A] dark:text-[#EDEDEB]' : 'text-[#71716E]'
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Hero Financial Summary Cards */}
      <View className="flex-row gap-3">
        {/* Income Card */}
        <View className="flex-1 p-4 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg flex-col gap-1">
          <Text className="text-[10px] uppercase tracking-wider font-bold text-[#71716E]">Total Income</Text>
          <Text className="text-xl font-light text-emerald-600 dark:text-emerald-400">
            {formatCurrency(analytics.totalIncomeMinor, currency)}
          </Text>
        </View>

        {/* Expenses Card */}
        <View className="flex-1 p-4 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg flex-col gap-1">
          <Text className="text-[10px] uppercase tracking-wider font-bold text-[#71716E]">Total Expenses</Text>
          <Text className="text-xl font-light text-orange-600 dark:text-orange-400">
            {formatCurrency(analytics.totalExpenseMinor, currency)}
          </Text>
        </View>
      </View>

      {/* Net Savings & Metrics */}
      <View className="flex-col gap-3 p-5 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg">
        <View className="flex-row items-center justify-between border-b border-[#F0F0EE] dark:border-[#2C2C29] pb-3">
          <View className="flex-col">
            <Text className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
              Net Savings
            </Text>
            <Text
              className={cn(
                'text-2xl font-light mt-0.5',
                analytics.netSavingsMinor >= 0
                  ? 'text-[#1A1A1A] dark:text-[#EDEDEB]'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {analytics.netSavingsMinor >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(analytics.netSavingsMinor), currency)}
            </Text>
          </View>

          <View className="flex-col items-end">
            <Text className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
              Savings Rate
            </Text>
            <Text className="text-2xl font-light text-[#1A1A1A] dark:text-[#EDEDEB] mt-0.5">
              {analytics.savingsRatePercentage}%
            </Text>
          </View>
        </View>

        {/* Secondary metric pills */}
        <View className="flex-row gap-2 pt-1">
          <View className="flex-1 p-3 bg-[#F9F9F8] dark:bg-[#252523] border border-[#E5E5E2] dark:border-[#333330] rounded-md flex-col gap-0.5">
            <Text className="text-[10px] text-[#71716E] font-medium uppercase tracking-wider">Avg Daily Spend</Text>
            <Text className="font-medium text-[#1A1A1A] dark:text-[#EDEDEB] text-xs">
              {formatCurrency(analytics.avgDailyExpenseMinor, currency)}
            </Text>
          </View>

          <View className="flex-1 p-3 bg-[#F9F9F8] dark:bg-[#252523] border border-[#E5E5E2] dark:border-[#333330] rounded-md flex-col gap-0.5">
            <Text className="text-[10px] text-[#71716E] font-medium uppercase tracking-wider">Largest Expense</Text>
            <Text numberOfLines={1} className="font-medium text-[#1A1A1A] dark:text-[#EDEDEB] text-xs">
              {analytics.largestTransaction
                ? formatCurrency(analytics.largestTransaction.amountMinor, currency)
                : 'None'}
            </Text>
          </View>
        </View>
      </View>

      {/* Spending By Category */}
      <View className="flex-col gap-3 p-5 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
            Spending by Category
          </Text>
          <Text className="text-xs text-[#71716E]">{analytics.categoryBreakdown.length} Categories</Text>
        </View>

        {analytics.categoryBreakdown.length === 0 ? (
          <Text className="text-xs text-[#71716E] py-3 text-center">No expense data in this period.</Text>
        ) : (
          <View className="flex-col gap-3">
            {analytics.categoryBreakdown.map((cat) => (
              <View key={cat.categoryId} className="flex-col gap-1">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2 flex-1 min-w-0 pr-2">
                    <View
                      className="w-5 h-5 rounded-md items-center justify-center"
                      style={{ backgroundColor: cat.categoryColor }}
                    >
                      <IconHelper name={cat.categoryIcon} size={12} color="#ffffff" />
                    </View>
                    <Text numberOfLines={1} className="text-xs font-medium text-[#1A1A1A] dark:text-[#EDEDEB]">
                      {cat.categoryName}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2 shrink-0">
                    <Text className="text-[#71716E] text-[11px]">{cat.percentage}%</Text>
                    <Text className="text-xs font-medium text-[#1A1A1A] dark:text-[#EDEDEB]">
                      {formatCurrency(cat.totalMinor, currency)}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View className="w-full h-1 bg-[#F0F0EE] dark:bg-[#333330] rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(3, cat.percentage)}%`,
                      backgroundColor: cat.categoryColor,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Spending By Account */}
      {analytics.accountBreakdown.length > 0 && (
        <View className="flex-col gap-3 p-5 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg">
          <Text className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
            Spending by Account
          </Text>
          <View className="flex-col gap-2">
            {analytics.accountBreakdown.map((acc) => (
              <View
                key={acc.accountId}
                className="flex-row items-center justify-between p-2.5 rounded-md bg-[#F9F9F8] dark:bg-[#252523] border border-[#E5E5E2] dark:border-[#333330]"
              >
                <View className="flex-row items-center gap-2 flex-1 min-w-0 pr-2">
                  <View
                    className="w-6 h-6 rounded-md items-center justify-center"
                    style={{ backgroundColor: acc.accountColor }}
                  >
                    <IconHelper name={acc.accountIcon} size={13} color="#ffffff" />
                  </View>
                  <Text numberOfLines={1} className="text-xs font-medium text-[#1A1A1A] dark:text-[#EDEDEB]">
                    {acc.accountName}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2 shrink-0">
                  <Text className="text-[11px] text-[#71716E]">{acc.percentage}%</Text>
                  <Text className="text-xs font-medium text-[#1A1A1A] dark:text-[#EDEDEB]">
                    {formatCurrency(acc.totalMinor, currency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
