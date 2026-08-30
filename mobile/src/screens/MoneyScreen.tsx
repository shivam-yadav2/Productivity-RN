import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  PieChart,
  ListFilter,
  CalendarClock,
  Repeat,
} from 'lucide-react-native';
import { useDatabase } from '../context/DatabaseContext';
import { formatCurrency } from '../utils/currency';
import { Card } from '../components/ui/Card';
import { Button, buttonTextColor } from '../components/ui/Button';
import { TransactionList } from '../components/finance/TransactionList';
import { FinanceAnalyticsView } from '../components/finance/FinanceAnalyticsView';
import { BudgetCard } from '../components/finance/BudgetCard';
import { IconHelper } from '../components/ui/IconHelper';
import { AnimatedCurrency } from '../components/ui/AnimatedCurrency';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { FadeSwap } from '../components/ui/FadeSwap';
import { Transaction } from '../types';
import { cn } from '../utils/cn';

interface MoneyScreenProps {
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenTransfer: () => void;
  onOpenAccountsManager: () => void;
  onOpenCategoriesManager: () => void;
  onOpenBudgetManager: () => void;
  onOpenRecurringManager: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const MoneyScreen: React.FC<MoneyScreenProps> = ({
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenTransfer,
  onOpenAccountsManager,
  onOpenCategoriesManager,
  onOpenBudgetManager,
  onOpenRecurringManager,
  onSelectTransaction,
}) => {
  const { db } = useDatabase();
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'ANALYTICS' | 'BUDGETS'>('TRANSACTIONS');

  const accounts = Object.values(db.accounts).filter((a) => a.isActive);
  const totalBalanceMinor = accounts.reduce((sum, a) => sum + a.currentBalanceMinor, 0);
  const currency = db.settings.currency || 'INR';

  const tabs = [
    { key: 'TRANSACTIONS' as const, label: 'Ledger', icon: ListFilter },
    { key: 'ANALYTICS' as const, label: 'Analytics', icon: PieChart },
    { key: 'BUDGETS' as const, label: 'Budgets & Rules', icon: Repeat },
  ];

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 96, gap: 16 }}>
        {/* Header with Title & Quick Manage Triggers */}
        <View className="flex-row items-center justify-between pt-1">
          <View className="flex flex-col">
            <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Personal Finance
            </Text>
            <Text className="text-xs text-zinc-500">Offline multi-account ledger & analytics</Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={onOpenAccountsManager}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700"
            >
              <Text className="text-zinc-700 dark:text-zinc-300 text-xs font-semibold">Accounts</Text>
            </Pressable>
            <Pressable
              onPress={onOpenCategoriesManager}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700"
            >
              <Text className="text-zinc-700 dark:text-zinc-300 text-xs font-semibold">Categories</Text>
            </Pressable>
          </View>
        </View>

        {/* Account Balances Scrollable Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          <View className="w-40 p-3.5 rounded-2xl bg-zinc-900 dark:bg-zinc-800 flex flex-col justify-between border border-zinc-800">
            <Text className="text-[11px] text-zinc-400 font-medium">Total Liquid Net</Text>
            <AnimatedCurrency
              valueMinor={totalBalanceMinor}
              currency={currency}
              numberOfLines={1}
              className="text-base font-bold text-white mt-2"
            />
            <Text className="text-[10px] text-zinc-400 mt-1">{accounts.length} Active Accounts</Text>
          </View>

          {accounts.map((acc) => (
            <Pressable
              key={acc.id}
              onPress={onOpenAccountsManager}
              className="w-[150px] p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col justify-between active:border-zinc-300 dark:active:border-zinc-700"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1 pr-2" numberOfLines={1}>
                  {acc.name}
                </Text>
                <View
                  className="w-5 h-5 rounded-md items-center justify-center"
                  style={{ backgroundColor: acc.color }}
                >
                  <IconHelper name={acc.icon} size={12} color="#ffffff" />
                </View>
              </View>

              <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2" numberOfLines={1}>
                {formatCurrency(acc.currentBalanceMinor, acc.currency)}
              </Text>

              <Text className="text-[10px] text-zinc-400 uppercase tracking-wider mt-1">
                {acc.type.replace('_', ' ')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Main Tabs Navigation */}
        <SegmentedControl
          segments={tabs.map((t) => ({ key: t.key, label: t.label, icon: t.icon }))}
          value={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab Contents */}
        <FadeSwap swapKey={activeTab}>
        {activeTab === 'TRANSACTIONS' && (
          <TransactionList
            onSelectTransaction={onSelectTransaction}
            onOpenAddExpense={onOpenAddExpense}
            onOpenAddIncome={onOpenAddIncome}
            onOpenTransfer={onOpenTransfer}
          />
        )}

        {activeTab === 'ANALYTICS' && <FinanceAnalyticsView />}

        {activeTab === 'BUDGETS' && (
          <View className="flex flex-col gap-4">
            <BudgetCard onOpenBudgetManager={onOpenBudgetManager} />

            <Card>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <CalendarClock size={16} color="#6366f1" />
                  <Text className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Scheduled & Subscriptions
                  </Text>
                </View>
                <Button size="sm" variant="secondary" onPress={onOpenRecurringManager}>
                  <Text className={cn('text-xs font-semibold', buttonTextColor.secondary)}>Manage Rules</Text>
                </Button>
              </View>

              <Text className="text-xs text-zinc-500 mt-3">
                Manage automatic rules for rent, recurring EMIs, streaming subscriptions, and salary.
              </Text>
            </Card>
          </View>
        )}
        </FadeSwap>
      </ScrollView>

      {/* Pinned Bottom Action Toolbar */}
      <Animated.View
        entering={FadeInDown.springify().damping(20).mass(0.9)}
        style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}
      >
      {/* Each button takes an equal third: `style` lands on Button's animated wrapper
          (the flex item), while `className` styles the Pressable inside it. */}
      <View
        className="flex-row items-center gap-2 bg-white/90 dark:bg-zinc-900/90 p-2 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80"
        style={{ elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 }}
      >
        <Button
          size="sm"
          variant="secondary"
          onPress={onOpenTransfer}
          className="rounded-xl px-2"
          style={{ flex: 1 }}
        >
          <ArrowLeftRight size={14} color="#2563eb" />
          <Text numberOfLines={1} className={cn('text-xs ml-1', buttonTextColor.secondary)}>Transfer</Text>
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onPress={onOpenAddIncome}
          className="rounded-xl px-2"
          style={{ flex: 1 }}
        >
          <ArrowDownLeft size={14} color="#059669" />
          <Text numberOfLines={1} className={cn('text-xs ml-1', buttonTextColor.secondary)}>Income</Text>
        </Button>

        <Button
          size="sm"
          variant="primary"
          onPress={onOpenAddExpense}
          className="rounded-xl px-2"
          style={{ flex: 1 }}
        >
          <Plus size={16} color="#ffffff" />
          <Text numberOfLines={1} className={cn('text-xs font-bold ml-1', buttonTextColor.primary)}>Expense</Text>
        </Button>
      </View>
      </Animated.View>
    </View>
  );
};
