import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { useDatabase } from '../../context/DatabaseContext';
import { goalRepository } from '../../database/repositories/goalRepo';
import { formatCurrency } from '../../utils/currency';
import { IconHelper } from '../ui/IconHelper';
import { AnimatedBar } from '../ui/AnimatedBar';
import { Button, buttonTextColor } from '../ui/Button';
import { PiggyBank, Sliders, Plus } from 'lucide-react-native';
import { accent, ink } from '../../utils/theme';

interface SavingsGoalsCardProps {
  onOpenGoalsManager: () => void;
}

/** Tier-2 dashboard surface — flat purple color-block, echoing the Home hero. */
export const SavingsGoalsCard: React.FC<SavingsGoalsCardProps> = ({ onOpenGoalsManager }) => {
  const { db } = useDatabase();
  const goals = goalRepository.getAll();
  const topGoals = goals.slice(0, 2);
  const isDark = useColorScheme() === 'dark';

  const cardBg = isDark ? accent.purple.deep : accent.purple.bg;
  const cardBorder = accent.purple.base + '40';
  const accentText = isDark ? accent.purple.bg : accent.purple.deep;
  const primaryText = isDark ? '#FFFFFF' : ink[900];
  const mutedText = isDark ? '#FFFFFFB3' : accent.purple.deep + 'B3';

  if (goals.length === 0) {
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
            <Text className="text-xs font-semibold" style={{ color: primaryText }}>Savings Goals</Text>
            <Text className="text-[11px]" style={{ color: mutedText }}>No savings goals yet</Text>
          </View>
        </View>
        <Button size="sm" variant="secondary" onPress={onOpenGoalsManager}>
          <Plus size={14} color={accentText} />
          <Text className={buttonTextColor.secondary}>Create Goal</Text>
        </Button>
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
            Savings Goals
          </Text>
        </View>
        <Pressable onPress={onOpenGoalsManager} className="flex-row items-center gap-1">
          <Sliders size={14} color={accentText} />
          <Text className="text-xs font-medium" style={{ color: accentText }}>Manage</Text>
        </Pressable>
      </View>

      <View className="flex-col gap-2.5">
        {topGoals.map((goal) => {
          const percent = goal.targetAmountMinor > 0 ? (goal.savedAmountMinor / goal.targetAmountMinor) * 100 : 0;
          return (
            <View key={goal.id} className="flex-col gap-1">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5 flex-1 min-w-0 pr-2">
                  <IconHelper name={goal.icon} size={14} color={accentText} />
                  <Text numberOfLines={1} className="text-xs font-medium" style={{ color: primaryText }}>
                    {goal.name}
                  </Text>
                </View>
                <Text className="font-mono text-[11px] shrink-0" style={{ color: mutedText }}>
                  {formatCurrency(goal.savedAmountMinor, db.settings.currency)} /{' '}
                  {formatCurrency(goal.targetAmountMinor, db.settings.currency)}
                </Text>
              </View>

              <AnimatedBar
                percent={Math.min(100, percent)}
                trackClassName="h-1 bg-white/40 dark:bg-white/10 rounded-full"
                fillColor={goal.color}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};
