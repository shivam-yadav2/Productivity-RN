import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { useDatabase } from '../../context/DatabaseContext';
import { debtRepository } from '../../database/repositories/debtRepo';
import { formatCurrency } from '../../utils/currency';
import { IconHelper } from '../ui/IconHelper';
import { AnimatedBar } from '../ui/AnimatedBar';
import { Button, buttonTextColor } from '../ui/Button';
import { Landmark, Sliders, Plus } from 'lucide-react-native';
import { accent, ink } from '../../utils/theme';

interface DebtsCardProps {
  onOpenDebtsManager: () => void;
}

/** Tier-2 dashboard surface — flat pink color-block, echoing the Home hero. */
export const DebtsCard: React.FC<DebtsCardProps> = ({ onOpenDebtsManager }) => {
  const { db } = useDatabase();
  const debts = debtRepository.getAll();
  const topDebts = debts.slice(0, 2);
  const isDark = useColorScheme() === 'dark';

  const cardBg = isDark ? accent.pink.deep : accent.pink.bg;
  const cardBorder = accent.pink.base + '40';
  const accentText = isDark ? accent.pink.bg : accent.pink.deep;
  const primaryText = isDark ? '#FFFFFF' : ink[900];
  const mutedText = isDark ? '#FFFFFFB3' : accent.pink.deep + 'B3';

  if (debts.length === 0) {
    return (
      <View
        className="p-4 rounded-3xl flex-row items-center justify-between border"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-md items-center justify-center bg-white/40 dark:bg-black/15">
            <Landmark size={16} color={accentText} />
          </View>
          <View>
            <Text className="text-xs font-semibold" style={{ color: primaryText }}>Debt Tracker</Text>
            <Text className="text-[11px]" style={{ color: mutedText }}>No debts tracked yet</Text>
          </View>
        </View>
        <Button size="sm" variant="secondary" onPress={onOpenDebtsManager}>
          <Plus size={14} color={accentText} />
          <Text className={buttonTextColor.secondary}>Add Debt</Text>
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
          <Landmark size={16} color={accentText} />
          <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: accentText }}>
            Debt Tracker
          </Text>
        </View>
        <Pressable onPress={onOpenDebtsManager} className="flex-row items-center gap-1">
          <Sliders size={14} color={accentText} />
          <Text className="text-xs font-medium" style={{ color: accentText }}>Manage</Text>
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
                  <IconHelper name={debt.icon} size={14} color={accentText} />
                  <Text numberOfLines={1} className="text-xs font-medium" style={{ color: primaryText }}>
                    {debt.name}
                  </Text>
                </View>
                <Text className="font-mono text-[11px] shrink-0" style={{ color: mutedText }}>
                  {formatCurrency(debt.currentBalanceMinor, db.settings.currency)} left
                </Text>
              </View>

              <AnimatedBar
                percent={Math.min(100, Math.max(0, payoffPercent))}
                trackClassName="h-1 bg-white/40 dark:bg-white/10 rounded-full"
                fillColor={debt.color}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};
