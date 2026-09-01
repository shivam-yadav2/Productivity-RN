import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import {
  Plus,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Bell,
} from 'lucide-react-native';
import { useDatabase } from '../context/DatabaseContext';
import { useTheme } from '../context/ThemeContext';
import { getTodayDateString, getGreetingTime, formatDateDisplay } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import { budgetService } from '../services/budgetService';
import { analyticsService } from '../services/analyticsService';
import { ink, inkMuted } from '../utils/theme';
import { Logo } from '../components/ui/Logo';
import { DayPicker } from '../components/home/DayPicker';
import { BalanceHeroCard } from '../components/home/BalanceHeroCard';
import { TaskSummaryCard } from '../components/home/TaskSummaryCard';
import { HabitSummaryCard } from '../components/home/HabitSummaryCard';
import { QuickActionsCard } from '../components/home/QuickActionsCard';
import { TaskItem } from '../components/productivity/TaskItem';
import { TaskQuickAdd } from '../components/productivity/TaskQuickAdd';
import { HabitCard } from '../components/productivity/HabitCard';
import { habitRepository } from '../database/repositories/habitRepo';
import { recurringRepository } from '../database/repositories/recurringRepo';
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
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

  const upcomingBills = recurringRepository
    .getAll()
    .filter((r) => r.reminderEnabled && r.isActive)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, 5);

  const now = new Date();
  const headerDateLabel = `${now.toLocaleDateString('en-US', { weekday: 'long' })}, ${now.getDate()} ${now.toLocaleDateString('en-US', { month: 'short' })}`;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48, gap: 22 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between pt-1">
        <View className="flex-row items-center gap-3">
          <View className="w-[42px] h-[42px] rounded-2xl bg-ink-900 dark:bg-ink-100 items-center justify-center">
            <Logo size={18} color={isDark ? ink[950] : ink[50]} backdropColor={isDark ? ink[100] : ink[900]} />
          </View>
          <View>
            <Text className="font-jakarta-extrabold text-[19px] text-ink-900 dark:text-ink-50 tracking-tight">
              Good {getGreetingTime()}
            </Text>
            <Text className="text-[12.5px] font-medium text-ink-500 mt-0.5">{headerDateLabel}</Text>
          </View>
        </View>

        <Pressable
          onPress={onOpenAddExpense}
          accessibilityLabel="Add expense"
          className="w-10 h-10 rounded-full bg-ink-900 dark:bg-ink-100 items-center justify-center active:opacity-90"
        >
          <Plus size={18} color={isDark ? ink[900] : '#FFFFFF'} />
        </Pressable>
      </View>

      {/* Day picker */}
      <DayPicker />

      {/* Balance hero */}
      <BalanceHeroCard
        totalBalanceMinor={totalBalanceMinor}
        spentTodayMinor={todayAnalytics.totalExpenseMinor}
        currency={currency}
        budgetLabel={overall ? `${overall.percentage}% used` : 'No limit set'}
        onPressAccounts={onNavigateToMoney}
      />

      {/* Your day: task / habit / quick-action tiles */}
      <View>
        <Text className="font-jakarta-extrabold text-[17px] text-ink-900 dark:text-ink-50 tracking-tight mb-3">
          Your day
        </Text>
        <View className="flex-row gap-3">
          <TaskSummaryCard
            tasks={todayTasks}
            onSelectTask={onSelectTask}
            onNavigateToProductivity={onNavigateToProductivity}
          />
          <View className="flex-1 gap-3">
            <HabitSummaryCard
              habits={habits}
              doneToday={habitsDoneToday}
              onPress={onEditHabit}
              onNavigateToProductivity={onNavigateToProductivity}
            />
            <QuickActionsCard
              onExpense={onOpenAddExpense}
              onIncome={onOpenAddIncome}
              onTransfer={onOpenTransfer}
              onFocus={onNavigateToProductivity}
            />
          </View>
        </View>
      </View>

      {/* Tasks Due Today */}
      <View className="gap-2.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <CheckCircle2 size={16} color={inkMuted(isDark)} />
            <Text className="font-jakarta text-[15px] text-ink-900 dark:text-ink-50">Tasks due today</Text>
            <Text className="text-xs text-ink-400 font-medium">({todayTasks.length})</Text>
          </View>
          <Pressable onPress={onNavigateToProductivity} className="flex-row items-center">
            <Text className="text-xs font-medium text-ink-500 dark:text-ink-400">All tasks</Text>
            <ChevronRight size={12} color={inkMuted(isDark)} />
          </Pressable>
        </View>

        <TaskQuickAdd />

        <View className="gap-1.5">
          {todayTasks.length === 0 ? (
            <View className="p-4 items-center bg-ink-50 dark:bg-ink-800/30 rounded-2xl border border-ink-200/60 dark:border-ink-800">
              <Text className="text-xs text-ink-500 text-center">
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

      {/* Daily Habits */}
      <View className="gap-2.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={16} color="#f59e0b" />
            <Text className="font-jakarta text-[15px] text-ink-900 dark:text-ink-50">Daily habits</Text>
            <Text className="text-xs text-ink-400 font-medium">
              ({habitsDoneToday}/{habits.length} done)
            </Text>
          </View>
          <Pressable onPress={onNavigateToProductivity} className="flex-row items-center">
            <Text className="text-xs font-medium text-ink-500 dark:text-ink-400">Manage</Text>
            <ChevronRight size={12} color={inkMuted(isDark)} />
          </Pressable>
        </View>

        <View className="gap-2">
          {habits.slice(0, 3).map((h, i) => (
            <HabitCard key={h.id} habit={h} index={i} onEdit={onEditHabit} />
          ))}
        </View>
      </View>

      {/* Recent activity */}
      <View className="gap-2.5">
        <View className="flex-row items-center justify-between">
          <Text className="font-jakarta-extrabold text-[17px] text-ink-900 dark:text-ink-50 tracking-tight">
            Recent activity
          </Text>
          <Pressable onPress={onNavigateToMoney} className="flex-row items-center">
            <Text className="text-xs font-medium text-ink-500 dark:text-ink-400">See all</Text>
            <ChevronRight size={12} color={inkMuted(isDark)} />
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <View className="p-4 items-center bg-ink-50 dark:bg-ink-800/30 rounded-2xl border border-ink-200/60 dark:border-ink-800">
            <Text className="text-xs text-ink-500">No recent transactions recorded.</Text>
          </View>
        ) : (
          <View className="bg-surface dark:bg-surface-dark rounded-3xl border border-ink-100/70 dark:border-ink-800/70 overflow-hidden">
            {recentTransactions.map((tx, i) => (
              <View
                key={tx.id}
                className={i < recentTransactions.length - 1 ? 'border-b border-ink-100 dark:border-ink-800/60' : ''}
              >
                <TransactionItem transaction={tx} index={i} onPress={() => onSelectTransaction(tx)} />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Upcoming Bills — supplementary section, hidden entirely when there's nothing to show */}
      {upcomingBills.length > 0 && (
        <View className="gap-2.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Bell size={16} color={inkMuted(isDark)} />
              <Text className="font-jakarta text-[15px] text-ink-900 dark:text-ink-50">Upcoming bills</Text>
              <Text className="text-xs text-ink-400 font-medium">({upcomingBills.length})</Text>
            </View>
            <Pressable onPress={onNavigateToMoney} className="flex-row items-center">
              <Text className="text-xs font-medium text-ink-500 dark:text-ink-400">All rules</Text>
              <ChevronRight size={12} color={inkMuted(isDark)} />
            </Pressable>
          </View>

          <View className="bg-surface dark:bg-surface-dark rounded-3xl border border-ink-100/70 dark:border-ink-800/70 overflow-hidden">
            {upcomingBills.map((r, i) => {
              const cat = r.categoryId ? db.categories[r.categoryId] : undefined;
              return (
                <View
                  key={r.id}
                  className={
                    i < upcomingBills.length - 1
                      ? 'flex-row items-center justify-between p-3 border-b border-ink-100 dark:border-ink-800/60'
                      : 'flex-row items-center justify-between p-3'
                  }
                >
                  <View className="flex-col min-w-0 flex-1 pr-2">
                    <Text numberOfLines={1} className="text-xs font-semibold text-ink-900 dark:text-ink-100">
                      {r.note || cat?.name || 'Recurring Payment'}
                    </Text>
                    <Text className="text-[11px] text-ink-500">Due {formatDateDisplay(r.nextDueDate)}</Text>
                  </View>
                  <Text className="text-xs font-bold text-ink-900 dark:text-ink-100 shrink-0">
                    {formatCurrency(r.amountMinor, currency)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
};
