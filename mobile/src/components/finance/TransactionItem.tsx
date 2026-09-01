import React from 'react';
import { View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { Transaction } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { formatCurrency } from '../../utils/currency';
import { formatTimeDisplay } from '../../utils/date';
import { IconHelper } from '../ui/IconHelper';
import { PressableScale } from '../ui/PressableScale';
import { listItemEntering, listItemExiting, listItemLayout } from '../ui/listMotion';
import { useReducedMotion } from '../../utils/motion';
import { ArrowLeftRight } from 'lucide-react-native';
import { cn } from '../../utils/cn';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  index?: number;
}

export const TransactionItem: React.FC<TransactionItemProps> = React.memo(({ transaction, onPress, index = 0 }) => {
  const reduced = useReducedMotion();
  const { db } = useDatabase();

  const isExpense = transaction.type === 'EXPENSE';
  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';

  const category = transaction.categoryId ? db.categories[transaction.categoryId] : undefined;
  const sourceAccount = db.accounts[transaction.accountId];
  const destAccount = transaction.destinationAccountId
    ? db.accounts[transaction.destinationAccountId]
    : undefined;

  const currency = sourceAccount?.currency || db.settings.currency || 'INR';

  return (
    <Animated.View
      entering={reduced ? undefined : listItemEntering(index)}
      exiting={reduced ? undefined : listItemExiting}
      layout={reduced ? undefined : listItemLayout}
    >
    <PressableScale
      onPress={onPress}
      activeScale={0.99}
      dim={false}
      className="flex-row items-center justify-between p-3.5 rounded-xl"
    >
      <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-3">
        {/* Category / Type Icon */}
        <View
          className="w-10 h-10 rounded-xl items-center justify-center shrink-0 border"
          style={{
            backgroundColor: isTransfer ? '#eff6ff' : isIncome ? '#f0fdf4' : `${category?.color || '#f43f5e'}15`,
            borderColor: isTransfer ? '#bfdbfe' : isIncome ? '#bbf7d0' : `${category?.color || '#f43f5e'}30`,
          }}
        >
          {isTransfer ? (
            <ArrowLeftRight size={20} color="#2563eb" />
          ) : (
            <IconHelper
              name={category?.icon || (isIncome ? 'Coins' : 'Tag')}
              size={20}
              color={isIncome ? '#16a34a' : category?.color || '#e11d48'}
            />
          )}
        </View>

        {/* Title & Metadata */}
        <View className="flex-col min-w-0 flex-1">
          <Text numberOfLines={1} className="text-sm font-semibold text-ink-900 dark:text-ink-100">
            {isTransfer
              ? `${sourceAccount?.name || 'Account'} → ${destAccount?.name || 'Account'}`
              : category?.name || (isIncome ? 'Income' : 'Expense')}
          </Text>

          <View className="flex-row items-center gap-2 mt-0.5">
            {!isTransfer && (
              <Text numberOfLines={1} className="text-xs text-ink-500 dark:text-ink-400">
                {sourceAccount?.name || 'Account'}
              </Text>
            )}
            {transaction.time && (
              <Text className="text-xs text-ink-500 dark:text-ink-400">
                • {formatTimeDisplay(transaction.time)}
              </Text>
            )}
            {transaction.note && (
              <Text numberOfLines={1} className="text-xs text-ink-500 dark:text-ink-400 italic flex-1">
                "{transaction.note}"
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Amount with clear typography & sign distinction */}
      <View className="items-end shrink-0">
        <Text
          className={cn(
            'text-sm font-semibold tracking-tight',
            isIncome && 'text-emerald-600 dark:text-emerald-400',
            isExpense && 'text-ink-900 dark:text-ink-100',
            isTransfer && 'text-blue-600 dark:text-blue-400'
          )}
        >
          {isIncome ? '+' : isExpense ? '-' : '↔ '}
          {formatCurrency(transaction.amountMinor, currency, { showDecimals: false })}
        </Text>

        {transaction.tags && transaction.tags.length > 0 && (
          <View className="mt-0.5 px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded">
            <Text className="text-[10px] text-ink-600 dark:text-ink-400">#{transaction.tags[0]}</Text>
          </View>
        )}
      </View>
    </PressableScale>
    </Animated.View>
  );
});

TransactionItem.displayName = 'TransactionItem';
