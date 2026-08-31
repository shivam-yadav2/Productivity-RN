import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useDatabase } from '../../context/DatabaseContext';
import { debtRepository } from '../../database/repositories/debtRepo';
import { formatCurrency } from '../../utils/currency';
import { IconHelper } from '../ui/IconHelper';
import { AnimatedBar } from '../ui/AnimatedBar';
import { Button, buttonTextColor } from '../ui/Button';
import { Landmark, Sliders, Plus } from 'lucide-react-native';

interface DebtsCardProps {
  onOpenDebtsManager: () => void;
}

export const DebtsCard: React.FC<DebtsCardProps> = ({ onOpenDebtsManager }) => {
  const { db } = useDatabase();
  const debts = debtRepository.getAll();
  const topDebts = debts.slice(0, 2);

  if (debts.length === 0) {
    return (
      <View className="p-4 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-md bg-[#F0F0EE] dark:bg-[#252523] items-center justify-center">
            <Landmark size={16} color="#1A1A1A" />
          </View>
          <View>
            <Text className="text-xs font-semibold text-[#1A1A1A] dark:text-[#F3F3F1]">Debt Tracker</Text>
            <Text className="text-[11px] text-[#71716E]">No debts tracked yet</Text>
          </View>
        </View>
        <Button size="sm" variant="secondary" onPress={onOpenDebtsManager}>
          <Plus size={14} color="#1A1A1A" />
          <Text className={buttonTextColor.secondary}>Add Debt</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="p-5 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg flex-col gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Landmark size={16} color="#71716E" />
          <Text className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
            Debt Tracker
          </Text>
        </View>
        <Pressable onPress={onOpenDebtsManager} className="flex-row items-center gap-1">
          <Sliders size={14} color="#71716E" />
          <Text className="text-xs text-[#71716E] font-medium">Manage</Text>
        </Pressable>
      </View>

      <View className="flex-col gap-2.5">
        {topDebts.map((debt) => {
          const payoffPercent =
            debt.principalMinor > 0 ? (1 - debt.currentBalanceMinor / debt.principalMinor) * 100 : 0;
          return (
            <View key={debt.id} className="flex-col gap-1">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5 flex-1 min-w-0 pr-2">
                  <IconHelper name={debt.icon} size={14} color="#71716E" />
                  <Text numberOfLines={1} className="text-xs font-medium text-[#1A1A1A] dark:text-[#EDEDEB]">
                    {debt.name}
                  </Text>
                </View>
                <Text className="font-mono text-[11px] text-[#71716E] shrink-0">
                  {formatCurrency(debt.currentBalanceMinor, db.settings.currency)} left
                </Text>
              </View>

              <AnimatedBar
                percent={Math.min(100, Math.max(0, payoffPercent))}
                trackClassName="h-1 bg-[#F0F0EE] dark:bg-[#333330] rounded-full"
                fillColor={debt.color}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};
