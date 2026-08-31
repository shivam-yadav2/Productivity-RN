import './global.css';
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Home, Wallet, CheckSquare, FolderOpen, Settings, Lock, Moon, Sun, Search } from 'lucide-react-native';
import { DatabaseProvider, useDatabase } from './src/context/DatabaseContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SecurityProvider, useSecurity } from './src/context/SecurityContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { MoneyScreen } from './src/screens/MoneyScreen';
import { ProductivityScreen } from './src/screens/ProductivityScreen';
import { DocumentsScreen } from './src/screens/DocumentsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { PinLockScreen } from './src/components/security/PinLockScreen';
import { Logo } from './src/components/ui/Logo';
import { FadeSwap } from './src/components/ui/FadeSwap';
import { TabBarButton } from './src/components/ui/TabBarButton';

import { ExpenseFormModal } from './src/components/finance/ExpenseFormModal';
import { IncomeFormModal } from './src/components/finance/IncomeFormModal';
import { TransferFormModal } from './src/components/finance/TransferFormModal';
import { TransactionDetailModal } from './src/components/finance/TransactionDetailModal';
import { AccountsManagerModal } from './src/components/finance/AccountsManagerModal';
import { CategoryManagerModal } from './src/components/finance/CategoryManagerModal';
import { BudgetManagerModal } from './src/components/finance/BudgetManagerModal';
import { RecurringManagerModal } from './src/components/finance/RecurringManagerModal';
import { GoalsManagerModal } from './src/components/finance/GoalsManagerModal';
import { DebtsManagerModal } from './src/components/finance/DebtsManagerModal';
import { TaskDetailModal } from './src/components/productivity/TaskDetailModal';
import { HabitFormModal } from './src/components/productivity/HabitFormModal';
import { NoteEditorModal } from './src/components/productivity/NoteEditorModal';
import { GlobalSearchOverlay } from './src/components/search/GlobalSearchOverlay';
import { noteRepository } from './src/database/repositories/noteRepo';

import { Transaction, Task, Habit, Note } from './src/types';
import { cn } from './src/utils/cn';
import { audioService } from './src/services/audioService';
import { shareDocument } from './src/services/documentStorage';
import { SearchResult } from './src/services/searchService';

type TabType = 'HOME' | 'MONEY' | 'PRODUCTIVITY' | 'DOCUMENTS' | 'SETTINGS';

function MainApp() {
  useDatabase();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const { isLocked, hasPin, lockApp } = useSecurity();

  const [activeTab, setActiveTab] = useState<TabType>('HOME');

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isDebtsModalOpen, setIsDebtsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  if (isLocked) {
    return (
      <>
        <StatusBar style="light" />
        <PinLockScreen />
      </>
    );
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

  const handleSelectSearchResult = (result: SearchResult) => {
    setIsSearchOpen(false);
    if (result.type === 'transaction') {
      setSelectedTransaction(result.item);
      setActiveTab('MONEY');
    } else if (result.type === 'task') {
      setSelectedTask(result.item);
      setIsTaskModalOpen(true);
      setActiveTab('PRODUCTIVITY');
    } else if (result.type === 'habit') {
      setSelectedHabit(result.item);
      setIsHabitModalOpen(true);
      setActiveTab('PRODUCTIVITY');
    } else if (result.type === 'document') {
      setActiveTab('DOCUMENTS');
      shareDocument(result.item);
    } else if (result.type === 'note') {
      setSelectedNote(result.item);
      setIsNoteModalOpen(true);
      setActiveTab('PRODUCTIVITY');
    }
  };

  const tabs: { key: TabType; label: string; icon: typeof Home }[] = [
    { key: 'HOME', label: 'Today', icon: Home },
    { key: 'MONEY', label: 'Finance', icon: Wallet },
    { key: 'PRODUCTIVITY', label: 'Productivity', icon: CheckSquare },
    { key: 'DOCUMENTS', label: 'Documents', icon: FolderOpen },
    { key: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  return (
    <View className="flex-1 bg-zinc-100 dark:bg-zinc-950">
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      {/* Top Application Bar */}
      <SafeAreaView edges={['top']} className="bg-white/95 dark:bg-zinc-900/95 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <View className="flex-row items-center justify-between px-4 py-2.5">
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-xl bg-zinc-900 dark:bg-zinc-100 items-center justify-center">
              <Logo
                size={16}
                color={resolvedTheme === 'dark' ? '#18181B' : '#FFFFFF'}
                backdropColor={resolvedTheme === 'dark' ? '#F4F4F5' : '#18181B'}
              />
            </View>
            <View className="flex flex-col">
              <Text className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Personal</Text>
              <View className="flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <Text className="text-[10px] text-zinc-400">100% Offline</Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={() => setIsSearchOpen(true)}
              className="p-1.5 active:bg-zinc-100 dark:active:bg-zinc-800 rounded-lg"
            >
              <Search size={16} color="#71717a" />
            </Pressable>

            {hasPin && (
              <Pressable onPress={lockApp} className="p-1.5 active:bg-zinc-100 dark:active:bg-zinc-800 rounded-lg">
                <Lock size={16} color="#71717a" />
              </Pressable>
            )}

            <Pressable onPress={toggleTheme} className="p-1.5 active:bg-zinc-100 dark:active:bg-zinc-800 rounded-lg">
              {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#6366f1" />}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Main View Area */}
      <View className="flex-1 px-4 pt-3">
       <FadeSwap swapKey={activeTab} fill>
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
            onOpenGoalsManager={() => setIsGoalsModalOpen(true)}
            onOpenDebtsManager={() => setIsDebtsModalOpen(true)}
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
            onOpenNewNote={() => {
              setSelectedNote(null);
              setIsNoteModalOpen(true);
            }}
            onSelectNote={(note) => {
              setSelectedNote(note);
              setIsNoteModalOpen(true);
            }}
          />
        )}

        {activeTab === 'DOCUMENTS' && <DocumentsScreen />}

        {activeTab === 'SETTINGS' && (
          <SettingsScreen
            onOpenAccountsManager={() => setIsAccountsModalOpen(true)}
            onOpenCategoriesManager={() => setIsCategoriesModalOpen(true)}
          />
        )}
       </FadeSwap>
      </View>

      {/* Bottom Tab Bar */}
      <SafeAreaView edges={['bottom']} className="bg-white/95 dark:bg-zinc-900/95 border-t border-zinc-200/80 dark:border-zinc-800/80">
        <View className="flex-row items-center justify-around py-1.5 px-6">
          {tabs.map(({ key, label, icon: Icon }) => (
            <TabBarButton
              key={key}
              label={label}
              icon={Icon}
              active={activeTab === key}
              isDark={resolvedTheme === 'dark'}
              onPress={() => handleTabChange(key)}
            />
          ))}
        </View>
      </SafeAreaView>

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

      <AccountsManagerModal isOpen={isAccountsModalOpen} onClose={() => setIsAccountsModalOpen(false)} />

      <CategoryManagerModal isOpen={isCategoriesModalOpen} onClose={() => setIsCategoriesModalOpen(false)} />

      <BudgetManagerModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} />

      <RecurringManagerModal isOpen={isRecurringModalOpen} onClose={() => setIsRecurringModalOpen(false)} />

      <GoalsManagerModal isOpen={isGoalsModalOpen} onClose={() => setIsGoalsModalOpen(false)} />

      <DebtsManagerModal isOpen={isDebtsModalOpen} onClose={() => setIsDebtsModalOpen(false)} />

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

      <NoteEditorModal
        note={selectedNote}
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setSelectedNote(null);
        }}
        onSave={({ title, body }) => {
          if (selectedNote) {
            noteRepository.update(selectedNote.id, { title, body });
          } else {
            noteRepository.create({ title, body });
          }
          setIsNoteModalOpen(false);
          setSelectedNote(null);
        }}
        onDelete={
          selectedNote
            ? () => {
                noteRepository.delete(selectedNote.id);
                setIsNoteModalOpen(false);
                setSelectedNote(null);
              }
            : undefined
        }
      />

      <GlobalSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DatabaseProvider>
            <SecurityProvider>
              <MainApp />
            </SecurityProvider>
          </DatabaseProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
