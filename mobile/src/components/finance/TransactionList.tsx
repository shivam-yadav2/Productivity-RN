import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Transaction, TransactionType } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { transactionRepository } from '../../database/repositories/transactionRepo';
import { TransactionItem } from './TransactionItem';
import { formatDateDisplay } from '../../utils/date';
import { Search, Filter, Plus, SlidersHorizontal, X } from 'lucide-react-native';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';
import { ink } from '../../utils/theme';

interface TransactionListProps {
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenTransfer: () => void;
  limit?: number;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  onSelectTransaction,
  onOpenAddExpense,
  onOpenAddIncome,
  limit,
}) => {
  const { db } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'ALL'>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const transactions = useMemo(() => {
    return transactionRepository.filter({
      query: searchQuery,
      type: selectedType,
      accountId: selectedAccount === 'ALL' ? undefined : selectedAccount,
      categoryId: selectedCategory === 'ALL' ? undefined : selectedCategory,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.transactions, searchQuery, selectedType, selectedAccount, selectedCategory]);

  const displayedTransactions = limit ? transactions.slice(0, limit) : transactions;

  const groupedTransactions = useMemo(() => {
    const groups: { date: string; displayDate: string; items: Transaction[] }[] = [];
    let curDate = '';
    let curItems: Transaction[] = [];

    displayedTransactions.forEach((tx) => {
      if (tx.date !== curDate) {
        if (curItems.length > 0) {
          groups.push({ date: curDate, displayDate: formatDateDisplay(curDate), items: curItems });
        }
        curDate = tx.date;
        curItems = [tx];
      } else {
        curItems.push(tx);
      }
    });

    if (curItems.length > 0) {
      groups.push({ date: curDate, displayDate: formatDateDisplay(curDate), items: curItems });
    }

    return groups;
  }, [displayedTransactions]);

  const hasActiveFilters =
    selectedType !== 'ALL' || selectedAccount !== 'ALL' || selectedCategory !== 'ALL' || Boolean(searchQuery);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedAccount('ALL');
    setSelectedCategory('ALL');
  };

  const accountOptions = [
    { label: 'All Accounts', value: 'ALL' },
    ...Object.values(db.accounts).map((acc) => ({ label: acc.name, value: acc.id })),
  ];
  const categoryOptions = [
    { label: 'All Categories', value: 'ALL' },
    ...Object.values(db.categories).map((cat) => ({ label: `${cat.name} (${cat.type})`, value: cat.id })),
  ];

  return (
    <View className="flex-col gap-3">
      {/* Search & Filter Bar */}
      <View className="flex-col gap-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 relative justify-center">
            <View className="absolute left-3 z-10">
              <Search size={16} color={ink[500]} />
            </View>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search transactions..."
              placeholderTextColor={ink[500]}
              className="w-full pl-9 pr-8 py-2 text-xs bg-surface dark:bg-surface-dark border border-ink-200 dark:border-ink-800 rounded-md text-ink-900 dark:text-ink-100"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} className="absolute right-2.5">
                <X size={14} color={ink[500]} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            className={cn(
              'p-2.5 rounded-md border flex-row items-center gap-1.5',
              showFilters || hasActiveFilters
                ? 'bg-ink-900 border-ink-900 dark:bg-ink-100 dark:border-ink-100'
                : 'bg-surface dark:bg-surface-dark border-ink-200 dark:border-ink-800'
            )}
          >
            <SlidersHorizontal size={14} color={showFilters || hasActiveFilters ? '#ffffff' : ink[500]} />
          </Pressable>
        </View>

        {/* Filter Drawer */}
        {showFilters && (
          <View className="p-3 bg-ink-50 dark:bg-ink-800 rounded-md border border-ink-200 dark:border-ink-700 flex-col gap-2.5">
            {/* Type selector */}
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text className="text-ink-500 font-medium mr-1 text-[11px]">Type:</Text>
              {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  className={cn(
                    'px-2 py-1 rounded',
                    selectedType === type ? 'bg-ink-900 dark:bg-ink-100' : 'bg-ink-200 dark:bg-ink-700'
                  )}
                >
                  <Text
                    className={cn(
                      'text-[11px] font-medium',
                      selectedType === type ? 'text-white dark:text-ink-900' : 'text-ink-500 dark:text-ink-400'
                    )}
                  >
                    {type === 'ALL' ? 'All' : type}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Account & Category Filter Row */}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Select
                  label="Account"
                  value={selectedAccount}
                  onChange={setSelectedAccount}
                  options={accountOptions}
                />
              </View>
              <View className="flex-1">
                <Select
                  label="Category"
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={categoryOptions}
                />
              </View>
            </View>

            {hasActiveFilters && (
              <Pressable onPress={clearFilters} className="pt-1">
                <Text className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  Clear all active filters
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Transaction Feed */}
      {displayedTransactions.length === 0 ? (
        <View className="py-12 px-4 items-center justify-center bg-surface dark:bg-surface-dark rounded-lg border border-ink-200 dark:border-ink-800">
          <View className="w-10 h-10 rounded-md bg-ink-100 dark:bg-ink-800 items-center justify-center mb-3">
            <Filter size={20} color={ink[500]} />
          </View>
          <Text className="text-xs font-semibold text-ink-900 dark:text-ink-100">
            {hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
          </Text>
          <Text className="text-[11px] text-ink-500 text-center max-w-xs mt-1">
            {hasActiveFilters
              ? 'Try resetting the filters or modifying your search query.'
              : 'Start tracking your spending and personal income today.'}
          </Text>
          {!hasActiveFilters && (
            <View className="flex-row items-center gap-2 mt-4">
              <Pressable
                onPress={onOpenAddExpense}
                className="px-3 py-1.5 bg-ink-900 dark:bg-ink-100 rounded-md flex-row items-center gap-1"
              >
                <Plus size={14} color="#ffffff" />
                <Text className="text-xs font-semibold text-white dark:text-ink-900">Add Expense</Text>
              </Pressable>
              <Pressable
                onPress={onOpenAddIncome}
                className="px-3 py-1.5 border border-ink-200 dark:border-ink-700 rounded-md"
              >
                <Text className="text-xs font-semibold text-ink-900 dark:text-ink-100">Add Income</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <View className="flex-col gap-3">
          {groupedTransactions.map((group) => (
            <View key={group.date} className="flex-col gap-1">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-ink-500 px-1">
                {group.displayDate}
              </Text>
              <View className="bg-surface dark:bg-surface-dark rounded-lg border border-ink-200 dark:border-ink-800 overflow-hidden">
                {group.items.map((tx, i) => (
                  <View
                    key={tx.id}
                    className={i > 0 ? 'border-t border-ink-100 dark:border-ink-800' : ''}
                  >
                    <TransactionItem transaction={tx} index={i} onPress={() => onSelectTransaction(tx)} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
