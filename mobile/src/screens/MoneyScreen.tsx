import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, useColorScheme } from 'react-native';
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
import { SavingsGoalsCard } from '../components/finance/SavingsGoalsCard';
import { DebtsCard } from '../components/finance/DebtsCard';
import { IconHelper } from '../components/ui/IconHelper';
import { AnimatedCurrency } from '../components/ui/AnimatedCurrency';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { FadeSwap } from '../components/ui/FadeSwap';
import { Transaction } from '../types';
import { cn } from '../utils/cn';
import { accent } from '../utils/theme';

interface MoneyScreenProps {
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenTransfer: () => void;
  onOpenAccountsManager: () => void;
  onOpenCategoriesManager: () => void;
  onOpenBudgetManager: () => void;
  onOpenRecurringManager: () => void;
  onOpenGoalsManager: () => void;
  onOpenDebtsManager: () => void;
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
  onOpenGoalsManager,
  onOpenDebtsManager,
  onSelectTransaction,
}) => {
  const { db } = useDatabase();
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'ANALYTICS' | 'BUDGETS'>('TRANSACTIONS');
  const isDark = useColorScheme() === 'dark';

  const heroBg = isDark ? accent.purple.deep : accent.purple.base;
  const heroBorder = accent.purple.base + '40';
  const heroMuted = isDark ? '#FFFFFFB3' : '#FFFFFFCC';

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
            <Text className="text-xl font-jakarta-extrabold text-ink-900 dark:text-ink-100 tracking-tight">
              Personal Finance
            </Text>
            <Text className="text-xs text-ink-500">Offline multi-account ledger & analytics</Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={onOpenAccountsManager}
              className="px-2.5 py-1.5 rounded-xl bg-ink-100 dark:bg-ink-800 active:bg-ink-200 dark:active:bg-ink-700"
            >
              <Text className="text-ink-700 dark:text-ink-300 text-xs font-semibold">Accounts</Text>
            </Pressable>
            <Pressable
              onPress={onOpenCategoriesManager}
              className="px-2.5 py-1.5 rounded-xl bg-ink-100 dark:bg-ink-800 active:bg-ink-200 dark:active:bg-ink-700"
            >
              <Text className="text-ink-700 dark:text-ink-300 text-xs font-semibold">Categories</Text>
            </Pressable>
          </View>
        </View>

        {/* Account Balances Scrollable Strip — the balance hero is a Tier-2 flat-purple
            dashboard surface; the per-account cards below it stay on the neutral Tier-1
            palette so the hero reads as the one "headline" card in the strip. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          <View
            className="w-40 p-3.5 rounded-3xl flex flex-col justify-between border"
            style={{ backgroundColor: heroBg, borderColor: heroBorder }}
          >
            <Text className="text-[11px] font-medium" style={{ color: heroMuted }}>Total Liquid Net</Text>
            <AnimatedCurrency
              valueMinor={totalBalanceMinor}
              currency={currency}
              numberOfLines={1}
              className="text-base font-jakarta-extrabold text-white mt-2"
            />
            <Text className="text-[10px] mt-1" style={{ color: heroMuted }}>{accounts.length} Active Accounts</Text>
          </View>

          {accounts.map((acc) => (
            <Pressable
              key={acc.id}
              onPress={onOpenAccountsManager}
              className="w-[150px] p-3.5 rounded-3xl bg-surface dark:bg-surface-dark border border-ink-200/80 dark:border-ink-800/80 flex flex-col justify-between active:border-ink-300 dark:active:border-ink-700"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-ink-800 dark:text-ink-200 flex-1 pr-2" numberOfLines={1}>
                  {acc.name}
                </Text>
                <View
                  className="w-5 h-5 rounded-md items-center justify-center"
                  style={{ backgroundColor: acc.color }}
                >
                  <IconHelper name={acc.icon} size={12} color="#ffffff" />
                </View>
              </View>

              <Text className="text-sm font-bold text-ink-900 dark:text-ink-100 mt-2" numberOfLines={1}>
                {formatCurrency(acc.currentBalanceMinor, acc.currency)}
              </Text>

              <Text className="text-[10px] text-ink-400 uppercase tracking-wider mt-1">
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

            <SavingsGoalsCard onOpenGoalsManager={onOpenGoalsManager} />

            <DebtsCard onOpenDebtsManager={onOpenDebtsManager} />

            <Card>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <CalendarClock size={16} color="#6366f1" />
                  <Text className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300">
                    Scheduled & Subscriptions
                  </Text>
                </View>
                <Button size="sm" variant="secondary" onPress={onOpenRecurringManager}>
                  <Text className={cn('text-xs font-semibold', buttonTextColor.secondary)}>Manage Rules</Text>
                </Button>
              </View>

              <Text className="text-xs text-ink-500 mt-3">
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
        className="flex-row items-center gap-2 bg-surface/90 dark:bg-surface-dark/90 p-2 rounded-3xl border border-ink-200/80 dark:border-ink-800/80"
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
