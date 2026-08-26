import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { transactionRepository } from '../../database/repositories/transactionRepo';
import { TransactionItem } from './TransactionItem';
import { formatDateDisplay } from '../../utils/date';
import { Search, Filter, Plus, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../ui/Button';

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
  onOpenTransfer,
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
  }, [db.transactions, searchQuery, selectedType, selectedAccount, selectedCategory]);

  const displayedTransactions = limit ? transactions.slice(0, limit) : transactions;

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; displayDate: string; items: Transaction[] }[] = [];
    let curDate = '';
    let curItems: Transaction[] = [];

    displayedTransactions.forEach((tx) => {
      if (tx.date !== curDate) {
        if (curItems.length > 0) {
          groups.push({
            date: curDate,
            displayDate: formatDateDisplay(curDate),
            items: curItems,
          });
        }
        curDate = tx.date;
        curItems = [tx];
      } else {
        curItems.push(tx);
      }
    });

    if (curItems.length > 0) {
      groups.push({
        date: curDate,
        displayDate: formatDateDisplay(curDate),
        items: curItems,
      });
    }

    return groups;
  }, [displayedTransactions]);

  const hasActiveFilters = selectedType !== 'ALL' || selectedAccount !== 'ALL' || selectedCategory !== 'ALL' || Boolean(searchQuery);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedAccount('ALL');
    setSelectedCategory('ALL');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71716E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-md text-[#1A1A1A] dark:text-[#EDEDEB] placeholder:text-[#71716E] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71716E] hover:text-[#1A1A1A] dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              showFilters || hasActiveFilters
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] dark:bg-[#EDEDEB] dark:text-[#1A1A1A] dark:border-[#EDEDEB]'
                : 'bg-white dark:bg-[#1A1A19] border-[#E5E5E2] dark:border-[#2C2C29] text-[#71716E] hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
            title="Filter options"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="p-3 bg-[#F9F9F8] dark:bg-[#252523] rounded-md border border-[#E5E5E2] dark:border-[#333330] flex flex-col gap-2.5 text-xs animate-in slide-in-from-top-1 duration-150">
            {/* Type selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#71716E] font-medium mr-1 text-[11px]">Type:</span>
              {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedType === type
                      ? 'bg-[#1A1A1A] text-white dark:bg-[#EDEDEB] dark:text-[#1A1A1A]'
                      : 'bg-[#E5E5E2] dark:bg-[#333330] text-[#71716E] dark:text-[#A8A8A4]'
                  }`}
                >
                  {type === 'ALL' ? 'All' : type}
                </button>
              ))}
            </div>

            {/* Account & Category Filter Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#71716E] block mb-1">Account</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#333330] text-[#1A1A1A] dark:text-[#EDEDEB] text-xs focus:outline-none"
                >
                  <option value="ALL">All Accounts</option>
                  {Object.values(db.accounts).map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#71716E] block mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#333330] text-[#1A1A1A] dark:text-[#EDEDEB] text-xs focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {Object.values(db.categories).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-rose-600 dark:text-rose-400 font-medium text-left hover:underline pt-1 cursor-pointer"
              >
                Clear all active filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transaction Feed */}
      {displayedTransactions.length === 0 ? (
        <div className="py-12 px-4 text-center bg-white dark:bg-[#1A1A19] rounded-lg border border-[#E5E5E2] dark:border-[#2C2C29] flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-md bg-[#F0F0EE] dark:bg-[#252523] flex items-center justify-center text-[#71716E] mb-3">
            <Filter className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-semibold text-[#1A1A1A] dark:text-[#EDEDEB]">
            {hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
          </h4>
          <p className="text-[11px] text-[#71716E] max-w-xs mt-1">
            {hasActiveFilters
              ? 'Try resetting the filters or modifying your search query.'
              : 'Start tracking your spending and personal income today.'}
          </p>
          {!hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={onOpenAddExpense}
                className="px-3 py-1.5 bg-[#1A1A1A] text-white dark:bg-[#EDEDEB] dark:text-[#1A1A1A] rounded-md text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Expense
              </button>
              <button
                onClick={onOpenAddIncome}
                className="px-3 py-1.5 border border-[#E5E5E2] dark:border-[#333330] rounded-md text-xs font-semibold hover:bg-[#F0F0EE] dark:hover:bg-[#252523] text-[#1A1A1A] dark:text-[#EDEDEB] cursor-pointer"
              >
                Add Income
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groupedTransactions.map((group) => (
            <div key={group.date} className="flex flex-col gap-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#71716E] px-1">
                {group.displayDate}
              </div>
              <div className="bg-white dark:bg-[#1A1A19] rounded-lg border border-[#E5E5E2] dark:border-[#2C2C29] overflow-hidden divide-y divide-[#F0F0EE] dark:divide-[#2C2C29] shadow-xs">
                {group.items.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onClick={() => onSelectTransaction(tx)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
