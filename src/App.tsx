import React, { useState } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { HomeScreen } from './screens/HomeScreen';
import { MoneyScreen } from './screens/MoneyScreen';
import { ProductivityScreen } from './screens/ProductivityScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { PinLockScreen } from './components/security/PinLockScreen';

// Modals
import { ExpenseFormModal } from './components/finance/ExpenseFormModal';
import { IncomeFormModal } from './components/finance/IncomeFormModal';
import { TransferFormModal } from './components/finance/TransferFormModal';
import { TransactionDetailModal } from './components/finance/TransactionDetailModal';
import { AccountsManagerModal } from './components/finance/AccountsManagerModal';
import { CategoryManagerModal } from './components/finance/CategoryManagerModal';
import { BudgetManagerModal } from './components/finance/BudgetManagerModal';
import { RecurringManagerModal } from './components/finance/RecurringManagerModal';
import { TaskDetailModal } from './components/productivity/TaskDetailModal';
import { HabitFormModal } from './components/productivity/HabitFormModal';

// Types
import { Transaction, Task, Habit } from './types';
import {
  Home,
  Wallet,
  CheckSquare,
  Settings,
  ShieldCheck,
  Lock,
  Moon,
  Sun,
  Plus,
} from 'lucide-react';
import { cn } from './utils/cn';
import { audioService } from './services/audioService';

type TabType = 'HOME' | 'MONEY' | 'PRODUCTIVITY' | 'SETTINGS';

function MainApp() {
  const { db } = useDatabase();
  const { theme, toggleTheme } = useTheme();
  const { isLocked, hasPin, lockApp } = useSecurity();

  const [activeTab, setActiveTab] = useState<TabType>('HOME');

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  // Selected Entities for editing / inspection
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  if (isLocked) {
    return <PinLockScreen />;
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    audioService.playSoftClick();
    audioService.triggerHaptic('light');
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setSelectedTransaction(null);
    setEditingTransaction(tx);
    if (tx.type === 'EXPENSE') setIsExpenseModalOpen(true);
    else if (tx.type === 'INCOME') setIsIncomeModalOpen(true);
    else if (tx.type === 'TRANSFER') setIsTransferModalOpen(true);
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    setSelectedTransaction(null);
    setEditingTransaction(null);
    if (tx.type === 'EXPENSE') setIsExpenseModalOpen(true);
    else if (tx.type === 'INCOME') setIsIncomeModalOpen(true);
    else if (tx.type === 'TRANSFER') setIsTransferModalOpen(true);
  };

  const handleStartFocusFromTask = (task: Task) => {
    setFocusTask(task);
    setActiveTab('PRODUCTIVITY');
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs shadow-xs">
              P
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Personal
              </span>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>100% Offline</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {hasPin && (
              <button
                onClick={lockApp}
                className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Lock Application"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-3">
        {activeTab === 'HOME' && (
          <HomeScreen
            onNavigateToMoney={() => handleTabChange('MONEY')}
            onNavigateToProductivity={() => handleTabChange('PRODUCTIVITY')}
            onOpenAddExpense={() => {
              setEditingTransaction(null);
              setIsExpenseModalOpen(true);
            }}
            onOpenAddIncome={() => {
              setEditingTransaction(null);
              setIsIncomeModalOpen(true);
            }}
            onOpenTransfer={() => {
              setEditingTransaction(null);
              setIsTransferModalOpen(true);
            }}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
            onSelectTask={(task) => {
              setSelectedTask(task);
              setIsTaskModalOpen(true);
            }}
            onStartFocusOnTask={handleStartFocusFromTask}
            onEditHabit={(habit) => {
              setSelectedHabit(habit);
              setIsHabitModalOpen(true);
            }}
          />
        )}

        {activeTab === 'MONEY' && (
          <MoneyScreen
            onOpenAddExpense={() => {
              setEditingTransaction(null);
              setIsExpenseModalOpen(true);
            }}
            onOpenAddIncome={() => {
              setEditingTransaction(null);
              setIsIncomeModalOpen(true);
            }}
            onOpenTransfer={() => {
              setEditingTransaction(null);
              setIsTransferModalOpen(true);
            }}
            onOpenAccountsManager={() => setIsAccountsModalOpen(true)}
            onOpenCategoriesManager={() => setIsCategoriesModalOpen(true)}
            onOpenBudgetManager={() => setIsBudgetModalOpen(true)}
            onOpenRecurringManager={() => setIsRecurringModalOpen(true)}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
          />
        )}

        {activeTab === 'PRODUCTIVITY' && (
          <ProductivityScreen
            onSelectTask={(task) => {
              setSelectedTask(task);
              setIsTaskModalOpen(true);
            }}
            onOpenNewTask={() => {
              setSelectedTask(null);
              setIsTaskModalOpen(true);
            }}
            onOpenNewHabit={() => {
              setSelectedHabit(null);
              setIsHabitModalOpen(true);
            }}
            onEditHabit={(habit) => {
              setSelectedHabit(habit);
              setIsHabitModalOpen(true);
            }}
            initialFocusTask={focusTask}
          />
        )}

        {activeTab === 'SETTINGS' && (
          <SettingsScreen
            onOpenAccountsManager={() => setIsAccountsModalOpen(true)}
            onOpenCategoriesManager={() => setIsCategoriesModalOpen(true)}
          />
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 py-1.5 px-6">
        <div className="max-w-xl mx-auto flex items-center justify-around">
          <button
            onClick={() => handleTabChange('HOME')}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer',
              activeTab === 'HOME'
                ? 'text-zinc-900 dark:text-zinc-100 font-bold'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            )}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Today</span>
          </button>

          <button
            onClick={() => handleTabChange('MONEY')}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer',
              activeTab === 'MONEY'
                ? 'text-zinc-900 dark:text-zinc-100 font-bold'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            )}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px]">Finance</span>
          </button>

          <button
            onClick={() => handleTabChange('PRODUCTIVITY')}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer',
              activeTab === 'PRODUCTIVITY'
                ? 'text-zinc-900 dark:text-zinc-100 font-bold'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            )}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px]">Productivity</span>
          </button>

          <button
            onClick={() => handleTabChange('SETTINGS')}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer',
              activeTab === 'SETTINGS'
                ? 'text-zinc-900 dark:text-zinc-100 font-bold'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px]">Settings</span>
          </button>
        </div>
      </nav>

      {/* Global Modals */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingTransaction(null);
        }}
        initialTransaction={editingTransaction}
      />

      <IncomeFormModal
        isOpen={isIncomeModalOpen}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setEditingTransaction(null);
        }}
        initialTransaction={editingTransaction}
      />

      <TransferFormModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setEditingTransaction(null);
        }}
        initialTransaction={editingTransaction}
      />

      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        onEdit={handleOpenEditTransaction}
        onDuplicate={handleDuplicateTransaction}
      />

      <AccountsManagerModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
      />

      <CategoryManagerModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />

      <BudgetManagerModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
      />

      <RecurringManagerModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
      />

      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onStartFocus={handleStartFocusFromTask}
      />

      <HabitFormModal
        habit={selectedHabit}
        isOpen={isHabitModalOpen}
        onClose={() => {
          setIsHabitModalOpen(false);
          setSelectedHabit(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <SecurityProvider>
          <MainApp />
        </SecurityProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}
