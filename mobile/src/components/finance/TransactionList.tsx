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
              <Search size={16} color="#71716E" />
            </View>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search transactions..."
              placeholderTextColor="#71716E"
              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-md text-[#1A1A1A] dark:text-[#EDEDEB]"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} className="absolute right-2.5">
                <X size={14} color="#71716E" />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            className={cn(
              'p-2.5 rounded-md border flex-row items-center gap-1.5',
              showFilters || hasActiveFilters
                ? 'bg-[#1A1A1A] border-[#1A1A1A] dark:bg-[#EDEDEB] dark:border-[#EDEDEB]'
                : 'bg-white dark:bg-[#1A1A19] border-[#E5E5E2] dark:border-[#2C2C29]'
            )}
          >
            <SlidersHorizontal size={14} color={showFilters || hasActiveFilters ? '#ffffff' : '#71716E'} />
          </Pressable>
        </View>

        {/* Filter Drawer */}
        {showFilters && (
          <View className="p-3 bg-[#F9F9F8] dark:bg-[#252523] rounded-md border border-[#E5E5E2] dark:border-[#333330] flex-col gap-2.5">
            {/* Type selector */}
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text className="text-[#71716E] font-medium mr-1 text-[11px]">Type:</Text>
              {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  className={cn(
                    'px-2 py-1 rounded',
                    selectedType === type ? 'bg-[#1A1A1A] dark:bg-[#EDEDEB]' : 'bg-[#E5E5E2] dark:bg-[#333330]'
                  )}
                >
                  <Text
                    className={cn(
                      'text-[11px] font-medium',
                      selectedType === type ? 'text-white dark:text-[#1A1A1A]' : 'text-[#71716E] dark:text-[#A8A8A4]'
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
        <View className="py-12 px-4 items-center justify-center bg-white dark:bg-[#1A1A19] rounded-lg border border-[#E5E5E2] dark:border-[#2C2C29]">
          <View className="w-10 h-10 rounded-md bg-[#F0F0EE] dark:bg-[#252523] items-center justify-center mb-3">
            <Filter size={20} color="#71716E" />
          </View>
          <Text className="text-xs font-semibold text-[#1A1A1A] dark:text-[#EDEDEB]">
            {hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
          </Text>
          <Text className="text-[11px] text-[#71716E] text-center max-w-xs mt-1">
            {hasActiveFilters
              ? 'Try resetting the filters or modifying your search query.'
              : 'Start tracking your spending and personal income today.'}
          </Text>
          {!hasActiveFilters && (
            <View className="flex-row items-center gap-2 mt-4">
              <Pressable
                onPress={onOpenAddExpense}
                className="px-3 py-1.5 bg-[#1A1A1A] dark:bg-[#EDEDEB] rounded-md flex-row items-center gap-1"
              >
                <Plus size={14} color="#ffffff" />
                <Text className="text-xs font-semibold text-white dark:text-[#1A1A1A]">Add Expense</Text>
              </Pressable>
              <Pressable
                onPress={onOpenAddIncome}
                className="px-3 py-1.5 border border-[#E5E5E2] dark:border-[#333330] rounded-md"
              >
                <Text className="text-xs font-semibold text-[#1A1A1A] dark:text-[#EDEDEB]">Add Income</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <View className="flex-col gap-3">
          {groupedTransactions.map((group) => (
            <View key={group.date} className="flex-col gap-1">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-[#71716E] px-1">
                {group.displayDate}
              </Text>
              <View className="bg-white dark:bg-[#1A1A19] rounded-lg border border-[#E5E5E2] dark:border-[#2C2C29] overflow-hidden">
                {group.items.map((tx, i) => (
                  <View
                    key={tx.id}
                    className={i > 0 ? 'border-t border-[#F0F0EE] dark:border-[#2C2C29]' : ''}
                  >
                    <TransactionItem transaction={tx} onPress={() => onSelectTransaction(tx)} />
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
