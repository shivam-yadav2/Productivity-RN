import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { budgetService } from '../../services/budgetService';
import { useDatabase } from '../../context/DatabaseContext';
import { formatCurrency } from '../../utils/currency';
import { IconHelper } from '../ui/IconHelper';
import { AnimatedBar } from '../ui/AnimatedBar';
import { PiggyBank, Sliders } from 'lucide-react-native';

interface BudgetCardProps {
  onOpenBudgetManager: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ onOpenBudgetManager }) => {
  const { db } = useDatabase();
  const isDark = useColorScheme() === 'dark';
  const { overall, categories } = budgetService.getMonthlyBudgetStatuses();

  /** Matches the bar colours the card used as Tailwind classes before they moved inline. */
  const barColor = (isOver: boolean, percentage: number, muted: boolean) => {
    if (isOver) return '#f43f5e';
    if (percentage > 85) return '#f59e0b';
    if (muted) return isDark ? '#999996' : '#71716E';
    return isDark ? '#EDEDEB' : '#1A1A1A';
  };

  if (!overall && categories.length === 0) {
    return (
      <View className="p-4 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-md bg-[#F0F0EE] dark:bg-[#252523] items-center justify-center">
            <PiggyBank size={16} color="#1A1A1A" />
          </View>
          <View>
            <Text className="text-xs font-semibold text-[#1A1A1A] dark:text-[#F3F3F1]">Monthly Budgets</Text>
            <Text className="text-[11px] text-[#71716E]">Track and limit monthly expenses</Text>
          </View>
        </View>
        <Pressable onPress={onOpenBudgetManager}>
          <Text className="text-xs font-semibold text-[#1A1A1A] dark:text-[#EDEDEB]">Set Budget</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="p-5 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg flex-col gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <PiggyBank size={16} color="#71716E" />
          <Text className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
            Monthly Budgets
          </Text>
        </View>
        <Pressable onPress={onOpenBudgetManager} className="flex-row items-center gap-1">
          <Sliders size={14} color="#71716E" />
          <Text className="text-xs text-[#71716E] font-medium">Manage</Text>
        </Pressable>
      </View>

      {/* Overall Budget Progress */}
      {overall && (
        <View className="flex-col gap-1.5 p-3.5 rounded-md bg-[#F9F9F8] dark:bg-[#252523] border border-[#E5E5E2] dark:border-[#333330]">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-[#1A1A1A] dark:text-[#EDEDEB]">Total Monthly</Text>
            <Text className="text-xs font-medium text-[#71716E]">
              {formatCurrency(overall.spentMinor, db.settings.currency)} /{' '}
              {formatCurrency(overall.limitMinor, db.settings.currency)}
            </Text>
          </View>

          {/* Progress bar */}
          <AnimatedBar
            percent={Math.min(100, overall.percentage)}
            trackClassName="h-1.5 bg-[#E5E5E2] dark:bg-[#333330] rounded-full"
            fillColor={barColor(overall.isOverBudget, overall.percentage, false)}
          />

          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] text-[#71716E]">{overall.percentage}% spent</Text>
            <Text className="text-[11px] text-[#71716E]">
              {overall.remainingMinor >= 0
                ? `${formatCurrency(overall.remainingMinor, db.settings.currency)} left`
                : `${formatCurrency(Math.abs(overall.remainingMinor), db.settings.currency)} over`}
            </Text>
          </View>
        </View>
      )}

      {/* Category Budgets Sub-list */}
      {categories.length > 0 && (
        <View className="flex-col gap-2.5 pt-1">
          {categories.slice(0, 3).map((catBudget, i) => (
            <View key={catBudget.id} className="flex-col gap-1">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5 flex-1 min-w-0 pr-2">
                  <IconHelper name={catBudget.categoryIcon} size={14} color="#71716E" />
                  <Text numberOfLines={1} className="text-xs font-medium text-[#1A1A1A] dark:text-[#EDEDEB]">
                    {catBudget.categoryName}
                  </Text>
                </View>
                <Text className="font-mono text-[11px] text-[#71716E] shrink-0">
                  {formatCurrency(catBudget.spentMinor, db.settings.currency)} /{' '}
                  {formatCurrency(catBudget.limitMinor, db.settings.currency)}
                </Text>
              </View>

              <AnimatedBar
                percent={Math.min(100, catBudget.percentage)}
                delay={i * 60}
                trackClassName="h-1 bg-[#F0F0EE] dark:bg-[#333330] rounded-full"
                fillColor={barColor(catBudget.isOverBudget, catBudget.percentage, true)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
