import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { formatCurrency } from '../utils/currency';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TransactionList } from '../components/finance/TransactionList';
import { FinanceAnalyticsView } from '../components/finance/FinanceAnalyticsView';
import { BudgetCard } from '../components/finance/BudgetCard';
import { IconHelper } from '../components/ui/IconHelper';
import { Transaction, Account } from '../types';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Sliders,
  Wallet,
  PieChart,
  ListFilter,
  CalendarClock,
  Repeat,
} from 'lucide-react';
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

  return (
    <div className="flex flex-col gap-4 pb-14">
      {/* Header with Title & Quick Manage Triggers */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Personal Finance
          </h1>
          <span className="text-xs text-zinc-500">Offline multi-account ledger & analytics</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenAccountsManager}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Accounts
          </button>
          <button
            onClick={onOpenCategoriesManager}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Categories
          </button>
        </div>
      </div>

      {/* Account Balances Scrollable Strip */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Total Net Card */}
        <div className="min-w-[160px] p-3.5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-800 shrink-0 flex flex-col justify-between border border-zinc-800 shadow-xs">
          <span className="text-[11px] text-zinc-400 font-medium">Total Liquid Net</span>
          <span className="text-base font-bold font-mono text-white mt-2 truncate">
            {formatCurrency(totalBalanceMinor, currency)}
          </span>
          <span className="text-[10px] text-zinc-400 mt-1">{accounts.length} Active Accounts</span>
        </div>

        {/* Individual Account Cards */}
        {accounts.map((acc) => (
          <div
            key={acc.id}
            onClick={onOpenAccountsManager}
            className="min-w-[150px] p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shrink-0 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate pr-2">
                {acc.name}
              </span>
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px]"
                style={{ backgroundColor: acc.color }}
              >
                <IconHelper name={acc.icon} size={12} />
              </div>
            </div>

            <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2 truncate">
              {formatCurrency(acc.currentBalanceMinor, acc.currency)}
            </span>

            <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-1">
              {acc.type.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/70 rounded-2xl">
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={cn(
            'flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
            activeTab === 'TRANSACTIONS'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          )}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={cn(
            'flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
            activeTab === 'ANALYTICS'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          )}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('BUDGETS')}
          className={cn(
            'flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
            activeTab === 'BUDGETS'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          )}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Budgets & Rules</span>
        </button>
      </div>

      {/* Tab Contents */}
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
        <div className="flex flex-col gap-4">
          <BudgetCard onOpenBudgetManager={onOpenBudgetManager} />

          {/* Scheduled & Recurring Shortcut Card */}
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Scheduled & Subscriptions
                </span>
              </div>
              <Button size="sm" variant="secondary" onClick={onOpenRecurringManager}>
                Manage Rules
              </Button>
            </div>

            <p className="text-xs text-zinc-500">
              Manage automatic rules for rent, recurring EMIs, streaming subscriptions, and salary.
            </p>
          </Card>
        </div>
      )}

      {/* Pinned Bottom Action Toolbar */}
      <div className="fixed bottom-16 sm:bottom-6 right-4 left-4 sm:left-auto sm:w-auto z-40 flex items-center justify-center sm:justify-end gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-2 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg">
        <Button
          size="sm"
          variant="secondary"
          onClick={onOpenTransfer}
          className="rounded-xl px-3 text-xs"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 mr-1 text-blue-600" /> Transfer
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={onOpenAddIncome}
          className="rounded-xl px-3 text-xs"
        >
          <ArrowDownLeft className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Income
        </Button>

        <Button
          size="sm"
          variant="primary"
          onClick={onOpenAddExpense}
          className="rounded-xl px-4 text-xs font-bold shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1" /> Expense
        </Button>
      </div>
    </div>
  );
};
