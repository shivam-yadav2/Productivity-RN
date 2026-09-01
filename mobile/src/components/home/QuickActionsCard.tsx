import React from 'react';
import { View, Pressable } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Clock, LucideIcon } from 'lucide-react-native';
import { accent } from '../../utils/theme';

interface QuickActionsCardProps {
  onExpense: () => void;
  onIncome: () => void;
  onTransfer: () => void;
  onFocus: () => void;
}

interface ActionTile {
  key: 'expense' | 'income' | 'transfer' | 'focus';
  label: string;
  Icon: LucideIcon;
}

const actions: ActionTile[] = [
  { key: 'expense', label: 'Add expense', Icon: ArrowUpRight },
  { key: 'income', label: 'Add income', Icon: ArrowDownLeft },
  { key: 'transfer', label: 'Transfer money', Icon: ArrowLeftRight },
  { key: 'focus', label: 'Start focus', Icon: Clock },
];

/** Flat pink "your day" tile — icon-only fast-action row (expense / income / transfer / focus). */
export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onExpense,
  onIncome,
  onTransfer,
  onFocus,
}) => {
  const handlers: Record<ActionTile['key'], () => void> = {
    expense: onExpense,
    income: onIncome,
    transfer: onTransfer,
    focus: onFocus,
  };

  return (
    <View className="rounded-[24px] bg-accentPink-bg p-3.5 flex-row items-center justify-around">
      {actions.map(({ key, label, Icon }) => (
        <Pressable
          key={key}
          onPress={handlers[key]}
          accessibilityLabel={label}
          className="w-[38px] h-[38px] rounded-[13px] bg-accentPink items-center justify-center active:opacity-80"
        >
          <Icon size={17} color={accent.pink.deep} strokeWidth={2.3} />
        </Pressable>
      ))}
    </View>
  );
};
