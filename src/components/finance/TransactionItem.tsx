import React from 'react';
import { Transaction } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { formatCurrency } from '../../utils/currency';
import { formatTimeDisplay } from '../../utils/date';
import { IconHelper } from '../ui/IconHelper';
import { ArrowRight, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onClick }) => {
  const { db } = useDatabase();

  const isExpense = transaction.type === 'EXPENSE';
  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';

  const category = transaction.categoryId ? db.categories[transaction.categoryId] : undefined;
  const sourceAccount = db.accounts[transaction.accountId];
  const destAccount = transaction.destinationAccountId
    ? db.accounts[transaction.destinationAccountId]
    : undefined;

  const currency = sourceAccount?.currency || db.settings.currency || 'INR';

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800/80 active:scale-[0.99]"
      id={`tx_item_${transaction.id}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Category / Type Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
          style={{
            backgroundColor: isTransfer
              ? '#eff6ff'
              : isIncome
              ? '#f0fdf4'
              : `${category?.color || '#f43f5e'}15`,
            borderColor: isTransfer
              ? '#bfdbfe'
              : isIncome
              ? '#bbf7d0'
              : `${category?.color || '#f43f5e'}30`,
            color: isTransfer ? '#2563eb' : isIncome ? '#16a34a' : category?.color || '#e11d48',
          }}
        >
          {isTransfer ? (
            <ArrowLeftRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <IconHelper name={category?.icon || (isIncome ? 'Coins' : 'Tag')} size={20} />
          )}
        </div>

        {/* Title & Metadata */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {isTransfer
                ? `${sourceAccount?.name || 'Account'} → ${destAccount?.name || 'Account'}`
                : category?.name || (isIncome ? 'Income' : 'Expense')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
            {!isTransfer && <span>{sourceAccount?.name || 'Account'}</span>}
            {transaction.time && <span>• {formatTimeDisplay(transaction.time)}</span>}
            {transaction.note && <span className="truncate italic">"{transaction.note}"</span>}
          </div>
        </div>
      </div>

      {/* Amount with clear typography & sign distinction */}
      <div className="flex flex-col items-end shrink-0 pl-3">
        <div
          className={cn(
            'text-sm font-semibold font-mono tracking-tight flex items-center gap-0.5',
            isIncome && 'text-emerald-600 dark:text-emerald-400',
            isExpense && 'text-zinc-900 dark:text-zinc-100',
            isTransfer && 'text-blue-600 dark:text-blue-400'
          )}
        >
          <span>
            {isIncome ? '+' : isExpense ? '-' : '↔ '}
            {formatCurrency(transaction.amountMinor, currency, { showDecimals: false })}
          </span>
        </div>

        {transaction.tags && transaction.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
              #{transaction.tags[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
