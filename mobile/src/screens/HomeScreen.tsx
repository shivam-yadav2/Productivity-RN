import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useDatabase } from '../context/DatabaseContext';
import { getTodayDateString, getGreetingTime, formatDateDisplay } from '../utils/date';
import { budgetService } from '../services/budgetService';
import { analyticsService } from '../services/analyticsService';
import { Card } from '../components/ui/Card';
import { AnimatedCurrency } from '../components/ui/AnimatedCurrency';
import { TaskItem } from '../components/productivity/TaskItem';
import { TaskQuickAdd } from '../components/productivity/TaskQuickAdd';
import { HabitCard } from '../components/productivity/HabitCard';
import { habitRepository } from '../database/repositories/habitRepo';
import { TransactionItem } from '../components/finance/TransactionItem';
import { Task, Transaction, Habit } from '../types';

interface HomeScreenProps {
  onNavigateToMoney: () => void;
  onNavigateToProductivity: () => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenTransfer: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onSelectTask: (task: Task) => void;
  onStartFocusOnTask: (task: Task) => void;
  onEditHabit: (habit: Habit) => void;
}

const actionTiles = [
  { key: 'expense', label: 'Expense', icon: ArrowUpRight, bg: 'bg-rose-50 dark:bg-rose-950/50', color: '#e11d48' },
  { key: 'income', label: 'Income', icon: ArrowDownLeft, bg: 'bg-emerald-50 dark:bg-emerald-950/50', color: '#10b981' },
  { key: 'transfer', label: 'Transfer', icon: ArrowLeftRight, bg: 'bg-blue-50 dark:bg-blue-950/50', color: '#2563eb' },
  { key: 'focus', label: 'Focus', icon: Clock, bg: 'bg-indigo-50 dark:bg-indigo-950/50', color: '#4f46e5' },
] as const;

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToMoney,
  onNavigateToProductivity,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenTransfer,
  onSelectTransaction,
  onSelectTask,
  onStartFocusOnTask,
  onEditHabit,
}) => {
  const { db } = useDatabase();
  const todayStr = getTodayDateString();
  const currency = db.settings.currency || 'INR';

  const todayAnalytics = analyticsService.getAnalyticsForPeriod('today');
  const { overall } = budgetService.getMonthlyBudgetStatuses();

  const totalBalanceMinor = Object.values(db.accounts)
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + a.currentBalanceMinor, 0);

  const todayTasks = Object.values(db.tasks)
    .filter((t) => t.dueDate === todayStr || t.priority === 'URGENT')
    .sort((a, b) => (a.status === 'COMPLETED' ? 1 : -1));

  const habits = Object.values(db.habits);
  const habitsDoneToday = habits.filter((h) => habitRepository.isCompletedToday(h.id, todayStr)).length;

  const recentTransactions = Object.values(db.transactions)
    .sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return (b.time || '').localeCompare(a.time || '');
    })
    .slice(0, 3);

  const handleActionPress = (key: (typeof actionTiles)[number]['key']) => {
    if (key === 'expense') onOpenAddExpense();
    else if (key === 'income') onOpenAddIncome();
    else if (key === 'transfer') onOpenTransfer();
    else onNavigateToProductivity();
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48, gap: 20 }}>
      {/* Calm Greeting Header */}
      <View className="flex-row items-center justify-between pt-1">
        <View className="flex flex-col">
          <Text className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {formatDateDisplay(todayStr)}
          </Text>
          <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Good {getGreetingTime()}
          </Text>
        </View>

        <Pressable
          onPress={onOpenAddExpense}
          className="flex-row items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 active:opacity-90"
        >
          <Plus size={16} color="#ffffff" />
          <Text className="text-white dark:text-zinc-900 text-xs font-semibold">Expense</Text>
        </Pressable>
      </View>

      {/* Main Financial Balance Hero Card */}
      {/* expo-linear-gradient's LinearGradient isn't a NativeWind-patched core component, so
          className is silently ignored on it — rounding/padding/border must live on a wrapping
          View instead, with LinearGradient only supplying the fill via inline style. */}
      <View className="rounded-2xl border border-zinc-800 overflow-hidden">
        <LinearGradient colors={['#18181b', '#09090b']} style={{ padding: 16, gap: 12 }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-zinc-400">Total Liquid Balance</Text>
            <Pressable onPress={onNavigateToMoney} className="flex-row items-center gap-0.5">
              <Text className="text-[11px] text-zinc-300">View Accounts</Text>
              <ChevronRight size={14} color="#d4d4d8" />
            </Pressable>
          </View>

          <AnimatedCurrency
            valueMinor={totalBalanceMinor}
            currency={currency}
            className="text-3xl font-bold tracking-tight text-white"
          />

          <View className="flex-row justify-between pt-3 border-t border-zinc-800">
            <View className="flex flex-col">
              <Text className="text-[11px] text-zinc-400">Spent Today</Text>
              <AnimatedCurrency
                valueMinor={todayAnalytics.totalExpenseMinor}
                currency={currency}
                className="font-semibold text-zinc-100 mt-0.5"
              />
            </View>

            <View className="flex flex-col items-end">
              <Text className="text-[11px] text-zinc-400">Monthly Budget</Text>
              <Text className="font-semibold text-zinc-100 mt-0.5">
                {overall ? `${overall.percentage}% used` : 'No limit set'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* 4-Button Fast Action Toolbar */}
      <View className="flex-row gap-2">
        {actionTiles.map(({ key, label, icon: Icon, bg, color }) => (
          <Pressable
            key={key}
            onPress={() => handleActionPress(key)}
            className="flex-1 flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 active:border-zinc-300 dark:active:border-zinc-700"
          >
            <View className={`w-8 h-8 rounded-xl ${bg} items-center justify-center mb-1`}>
              <Icon size={16} color={color} />
            </View>
            <Text className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Today's Tasks Section */}
      <View className="flex flex-col gap-2.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <CheckCircle2 size={16} color="#71717a" />
            <Text className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Tasks Due Today
            </Text>
            <Text className="text-xs text-zinc-400 font-medium">({todayTasks.length})</Text>
          </View>
          <Pressable onPress={onNavigateToProductivity} className="flex-row items-center">
            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">All Tasks</Text>
            <ChevronRight size={12} color="#71717a" />
          </Pressable>
        </View>

        <TaskQuickAdd />

        <View className="flex flex-col gap-1.5">
          {todayTasks.length === 0 ? (
            <View className="p-4 items-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
              <Text className="text-xs text-zinc-500 text-center">
                All tasks for today completed. Take a breath or add a new one.
              </Text>
            </View>
          ) : (
            todayTasks.map((t, i) => (
              <TaskItem
                key={t.id}
                task={t}
                index={i}
                onClick={() => onSelectTask(t)}
                onStartFocus={() => onStartFocusOnTask(t)}
              />
            ))
          )}
        </View>
      </View>

      {/* Daily Habits Quick Progress */}
      <View className="flex flex-col gap-2.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={16} color="#f59e0b" />
            <Text className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Daily Habits
            </Text>
            <Text className="text-xs text-zinc-400 font-medium">
              ({habitsDoneToday}/{habits.length} done)
            </Text>
          </View>
          <Pressable onPress={onNavigateToProductivity} className="flex-row items-center">
            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Manage</Text>
            <ChevronRight size={12} color="#71717a" />
          </Pressable>
        </View>

        <View className="flex flex-col gap-2">
          {habits.slice(0, 3).map((h, i) => (
            <HabitCard key={h.id} habit={h} index={i} onEdit={onEditHabit} />
          ))}
        </View>
      </View>

      {/* Recent Transactions List */}
      <View className="flex flex-col gap-2.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Recent Transactions
          </Text>
          <Pressable onPress={onNavigateToMoney} className="flex-row items-center">
            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Full Ledger</Text>
            <ChevronRight size={12} color="#71717a" />
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <View className="p-4 items-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
            <Text className="text-xs text-zinc-500">No recent transactions recorded.</Text>
          </View>
        ) : (
          <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 overflow-hidden">
            {recentTransactions.map((tx, i) => (
              <View
                key={tx.id}
                className={i < recentTransactions.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800/60' : ''}
              >
                <TransactionItem transaction={tx} index={i} onPress={() => onSelectTransaction(tx)} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};
