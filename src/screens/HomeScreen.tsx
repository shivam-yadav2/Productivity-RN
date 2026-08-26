import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { formatCurrency } from '../utils/currency';
import { getTodayDateString, getGreetingTime, formatDateDisplay } from '../utils/date';
import { budgetService } from '../services/budgetService';
import { analyticsService } from '../services/analyticsService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TaskItem } from '../components/productivity/TaskItem';
import { TaskQuickAdd } from '../components/productivity/TaskQuickAdd';
import { HabitCard } from '../components/productivity/HabitCard';
import { habitRepository } from '../database/repositories/habitRepo';
import { TransactionItem } from '../components/finance/TransactionItem';
import { IconHelper } from '../components/ui/IconHelper';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingDown,
  Clock,
  CheckCircle2,
  ChevronRight,
  PiggyBank,
  Sparkles,
} from 'lucide-react';
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
  const todayStr = getTodayDateString();
  const currency = db.settings.currency || 'INR';

  // Financial Stats
  const todayAnalytics = analyticsService.getAnalyticsForPeriod('today');
  const { overall } = budgetService.getMonthlyBudgetStatuses();

  // Calculate Net Worth / Total Liquid Balance across active accounts
  const totalBalanceMinor = Object.values(db.accounts)
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + a.currentBalanceMinor, 0);

  // Tasks for Today
  const todayTasks = Object.values(db.tasks)
    .filter((t) => t.dueDate === todayStr || t.priority === 'URGENT')
    .sort((a, b) => (a.status === 'COMPLETED' ? 1 : -1));

  // Habits for Today
  const habits = Object.values(db.habits);
  const habitsDoneToday = habits.filter((h) => habitRepository.isCompletedToday(h.id, todayStr)).length;

  // Recent 3 Transactions
  const recentTransactions = Object.values(db.transactions)
    .sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return (b.time || '').localeCompare(a.time || '');
    })
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-5 pb-12">
      {/* Calm Greeting Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {formatDateDisplay(todayStr)}
          </span>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Good {getGreetingTime()}
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Expense</span>
          </button>
        </div>
      </div>

      {/* Main Financial Balance Hero Card */}
      <Card className="p-4 flex flex-col gap-3 bg-linear-to-b from-zinc-900 to-zinc-950 text-white dark:from-zinc-900 dark:to-zinc-950 border-zinc-800 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Total Liquid Balance</span>
          <button
            onClick={onNavigateToMoney}
            className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-0.5"
          >
            View Accounts <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
          {formatCurrency(totalBalanceMinor, currency)}
        </div>

        {/* Today's Spend & Monthly Budget Progress Sub-strip */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800 text-xs">
          <div className="flex flex-col">
            <span className="text-[11px] text-zinc-400">Spent Today</span>
            <span className="font-semibold font-mono text-zinc-100 mt-0.5">
              {formatCurrency(todayAnalytics.totalExpenseMinor, currency)}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[11px] text-zinc-400">Monthly Budget</span>
            <span className="font-semibold font-mono text-zinc-100 mt-0.5">
              {overall ? `${overall.percentage}% used` : 'No limit set'}
            </span>
          </div>
        </div>
      </Card>

      {/* 4-Button Fast Action Toolbar */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onOpenAddExpense}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">Expense</span>
        </button>

        <button
          onClick={onOpenAddIncome}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">Income</span>
        </button>

        <button
          onClick={onOpenTransfer}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">Transfer</span>
        </button>

        <button
          onClick={onNavigateToProductivity}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">Focus</span>
        </button>
      </div>

      {/* Today's Tasks Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Tasks Due Today
            </h3>
            <span className="text-xs text-zinc-400 font-medium">({todayTasks.length})</span>
          </div>
          <button
            onClick={onNavigateToProductivity}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center"
          >
            All Tasks <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Quick Add Bar */}
        <TaskQuickAdd />

        {/* Task List */}
        <div className="flex flex-col gap-1.5">
          {todayTasks.length === 0 ? (
            <div className="p-4 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500">
              All tasks for today completed. Take a breath or add a new one.
            </div>
          ) : (
            todayTasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onClick={() => onSelectTask(t)}
                onStartFocus={() => onStartFocusOnTask(t)}
              />
            ))
          )}
        </div>
      </div>

      {/* Daily Habits Quick Progress */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Daily Habits
            </h3>
            <span className="text-xs text-zinc-400 font-medium">
              ({habitsDoneToday}/{habits.length} done)
            </span>
          </div>
          <button
            onClick={onNavigateToProductivity}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center"
          >
            Manage <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {habits.slice(0, 3).map((h) => (
            <HabitCard key={h.id} habit={h} onEdit={onEditHabit} />
          ))}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Recent Transactions
          </h3>
          <button
            onClick={onNavigateToMoney}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center"
          >
            Full Ledger <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-4 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500">
            No recent transactions recorded.
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/60 shadow-xs">
            {recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onClick={() => onSelectTransaction(tx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
