import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { budgetService } from '../../services/budgetService';
import { useDatabase } from '../../context/DatabaseContext';
import { formatCurrency } from '../../utils/currency';
import { IconHelper } from '../ui/IconHelper';
import { AnimatedBar } from '../ui/AnimatedBar';
import { PiggyBank, Sliders } from 'lucide-react-native';
import { accent, ink } from '../../utils/theme';

interface BudgetCardProps {
  onOpenBudgetManager: () => void;
}

/** This card is a Tier-2 dashboard surface — flat orange color-block, not the neutral
 *  `ink` palette used by the rest of the app's dense/data screens. */
export const BudgetCard: React.FC<BudgetCardProps> = ({ onOpenBudgetManager }) => {
  const { db } = useDatabase();
  const isDark = useColorScheme() === 'dark';
  const { overall, categories } = budgetService.getMonthlyBudgetStatuses();

  const cardBg = isDark ? accent.orange.deep : accent.orange.bg;
  const cardBorder = accent.orange.base + '40';
  const accentText = isDark ? accent.orange.bg : accent.orange.deep;
  const primaryText = isDark ? '#FFFFFF' : ink[900];
  const mutedText = isDark ? '#FFFFFFB3' : accent.orange.deep + 'B3';

  const barColor = (isOver: boolean, percentage: number, muted: boolean) => {
    if (isOver) return '#f43f5e';
    if (percentage > 85) return '#f59e0b';
    if (muted) return mutedText;
    return primaryText;
  };

  if (!overall && categories.length === 0) {
    return (
      <View
        className="p-4 rounded-3xl flex-row items-center justify-between border"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-md items-center justify-center bg-white/40 dark:bg-black/15">
            <PiggyBank size={16} color={accentText} />
          </View>
          <View>
            <Text className="text-xs font-semibold" style={{ color: primaryText }}>Monthly Budgets</Text>
            <Text className="text-[11px]" style={{ color: mutedText }}>Track and limit monthly expenses</Text>
          </View>
        </View>
        <Pressable onPress={onOpenBudgetManager}>
          <Text className="text-xs font-semibold" style={{ color: accentText }}>Set Budget</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className="p-5 rounded-3xl flex-col gap-3 border"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <PiggyBank size={16} color={accentText} />
          <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: accentText }}>
            Monthly Budgets
          </Text>
        </View>
        <Pressable onPress={onOpenBudgetManager} className="flex-row items-center gap-1">
          <Sliders size={14} color={accentText} />
          <Text className="text-xs font-medium" style={{ color: accentText }}>Manage</Text>
        </Pressable>
      </View>

      {/* Overall Budget Progress */}
      {overall && (
        <View
          className="flex-col gap-1.5 p-3.5 rounded-2xl bg-white/40 dark:bg-black/15 border"
          style={{ borderColor: cardBorder }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold" style={{ color: primaryText }}>Total Monthly</Text>
            <Text className="text-xs font-medium" style={{ color: mutedText }}>
              {formatCurrency(overall.spentMinor, db.settings.currency)} /{' '}
              {formatCurrency(overall.limitMinor, db.settings.currency)}
            </Text>
          </View>

          {/* Progress bar */}
          <AnimatedBar
            percent={Math.min(100, overall.percentage)}
            trackClassName="h-1.5 bg-white/50 dark:bg-white/10 rounded-full"
            fillColor={barColor(overall.isOverBudget, overall.percentage, false)}
          />

          <View className="flex-row items-center justify-between">
            <Text className="text-[11px]" style={{ color: mutedText }}>{overall.percentage}% spent</Text>
            <Text className="text-[11px]" style={{ color: mutedText }}>
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
                  <IconHelper name={catBudget.categoryIcon} size={14} color={accentText} />
                  <Text numberOfLines={1} className="text-xs font-medium" style={{ color: primaryText }}>
                    {catBudget.categoryName}
                  </Text>
                </View>
                <Text className="font-mono text-[11px] shrink-0" style={{ color: mutedText }}>
                  {formatCurrency(catBudget.spentMinor, db.settings.currency)} /{' '}
                  {formatCurrency(catBudget.limitMinor, db.settings.currency)}
                </Text>
              </View>

              <AnimatedBar
                percent={Math.min(100, catBudget.percentage)}
                delay={i * 60}
                trackClassName="h-1 bg-white/40 dark:bg-white/10 rounded-full"
                fillColor={barColor(catBudget.isOverBudget, catBudget.percentage, true)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
