import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { AnimatedCurrency } from '../ui/AnimatedCurrency';
import { accent } from '../../utils/theme';

interface BalanceHeroCardProps {
  totalBalanceMinor: number;
  spentTodayMinor: number;
  currency: string;
  budgetLabel: string;
  onPressAccounts: () => void;
}

/** Flat pastel-purple balance summary — replaces the previous dark gradient hero card. */
export const BalanceHeroCard: React.FC<BalanceHeroCardProps> = ({
  totalBalanceMinor,
  spentTodayMinor,
  currency,
  budgetLabel,
  onPressAccounts,
}) => {
  return (
    <View className="rounded-[28px] bg-accentPurple-bg overflow-hidden">
      <View className="absolute -top-[30px] -right-[30px] w-[130px] h-[130px] rounded-full bg-accentPurple opacity-25" />

      <View className="p-[22px] gap-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-[12.5px] font-semibold text-accentPurple-deep opacity-75">
            Total liquid balance
          </Text>
          <Pressable onPress={onPressAccounts} className="flex-row items-center gap-0.5">
            <Text className="text-[11.5px] font-semibold text-accentPurple-deep">Accounts</Text>
            <ChevronRight size={13} color={accent.purple.deep} />
          </Pressable>
        </View>

        <AnimatedCurrency
          valueMinor={totalBalanceMinor}
          currency={currency}
          className="font-jakarta-extrabold text-[34px] text-accentPurple-deep tracking-tight"
        />

        <View className="flex-row gap-[18px] mt-1.5">
          <View>
            <Text className="text-[11px] font-medium text-accentPurple-deep opacity-60">Spent today</Text>
            <AnimatedCurrency
              valueMinor={spentTodayMinor}
              currency={currency}
              className="font-jakarta text-sm text-accentPurple-deep mt-0.5"
            />
          </View>
          <View>
            <Text className="text-[11px] font-medium text-accentPurple-deep opacity-60">Monthly budget</Text>
            <Text className="font-jakarta text-sm text-accentPurple-deep mt-0.5">{budgetLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
