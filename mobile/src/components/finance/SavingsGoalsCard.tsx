import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useDatabase } from '../../context/DatabaseContext';
import { goalRepository } from '../../database/repositories/goalRepo';
import { formatCurrency } from '../../utils/currency';
import { IconHelper } from '../ui/IconHelper';
import { AnimatedBar } from '../ui/AnimatedBar';
import { Button, buttonTextColor } from '../ui/Button';
import { PiggyBank, Sliders, Plus } from 'lucide-react-native';

interface SavingsGoalsCardProps {
  onOpenGoalsManager: () => void;
}

export const SavingsGoalsCard: React.FC<SavingsGoalsCardProps> = ({ onOpenGoalsManager }) => {
  const { db } = useDatabase();
  const goals = goalRepository.getAll();
  const topGoals = goals.slice(0, 2);

  if (goals.length === 0) {
    return (
      <View className="p-4 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-md bg-[#F0F0EE] dark:bg-[#252523] items-center justify-center">
            <PiggyBank size={16} color="#1A1A1A" />
          </View>
          <View>
            <Text className="text-xs font-semibold text-[#1A1A1A] dark:text-[#F3F3F1]">Savings Goals</Text>
            <Text className="text-[11px] text-[#71716E]">No savings goals yet</Text>
          </View>
        </View>
        <Button size="sm" variant="secondary" onPress={onOpenGoalsManager}>
          <Plus size={14} color="#1A1A1A" />
          <Text className={buttonTextColor.secondary}>Create Goal</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="p-5 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg flex-col gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <PiggyBank size={16} color="#71716E" />
          <Text className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
            Savings Goals
          </Text>
        </View>
        <Pressable onPress={onOpenGoalsManager} className="flex-row items-center gap-1">
          <Sliders size={14} color="#71716E" />
          <Text className="text-xs text-[#71716E] font-medium">Manage</Text>
        </Pressable>
      </View>

      <View className="flex-col gap-2.5">
        {topGoals.map((goal) => {
          const percent = goal.targetAmountMinor > 0 ? (goal.savedAmountMinor / goal.targetAmountMinor) * 100 : 0;
          return (
            <View key={goal.id} className="flex-col gap-1">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5 flex-1 min-w-0 pr-2">
                  <IconHelper name={goal.icon} size={14} color="#71716E" />
                  <Text numberOfLines={1} className="text-xs font-medium text-[#1A1A1A] dark:text-[#EDEDEB]">
                    {goal.name}
                  </Text>
                </View>
                <Text className="font-mono text-[11px] text-[#71716E] shrink-0">
                  {formatCurrency(goal.savedAmountMinor, db.settings.currency)} /{' '}
                  {formatCurrency(goal.targetAmountMinor, db.settings.currency)}
                </Text>
              </View>

              <AnimatedBar
                percent={Math.min(100, percent)}
                trackClassName="h-1 bg-[#F0F0EE] dark:bg-[#333330] rounded-full"
                fillColor={goal.color}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};
