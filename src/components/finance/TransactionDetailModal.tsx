import React, { useState } from 'react';
import { Transaction } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { financeService } from '../../services/financeService';
import { formatCurrency } from '../../utils/currency';
import { formatFullDate } from '../../utils/date';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { IconHelper } from '../ui/IconHelper';
import { Trash2, Copy, Edit3, ArrowLeftRight, Check, AlertTriangle } from 'lucide-react';
import { audioService } from '../../services/audioService';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDuplicate: (tx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
}) => {
  const { db } = useDatabase();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!transaction) return null;

  const isExpense = transaction.type === 'EXPENSE';
  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';

  const category = transaction.categoryId ? db.categories[transaction.categoryId] : undefined;
  const sourceAccount = db.accounts[transaction.accountId];
  const destAccount = transaction.destinationAccountId
    ? db.accounts[transaction.destinationAccountId]
    : undefined;

  const currency = sourceAccount?.currency || db.settings.currency || 'INR';

  const handleDelete = () => {
    try {
      financeService.deleteTransaction(transaction.id);
      audioService.triggerHaptic('medium');
      setShowDeleteConfirm(false);
      onClose();
    } catch (e: any) {
      alert(e?.message || 'Failed to delete transaction.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction Details" maxWidth="sm">
      <div className="flex flex-col gap-5">
        {/* Amount & Type Hero Card */}
        <div className="flex flex-col items-center justify-center p-5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 border"
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
              <ArrowLeftRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            ) : (
              <IconHelper name={category?.icon || (isIncome ? 'Coins' : 'Tag')} size={24} />
            )}
          </div>

          <div
            className={`text-2xl font-bold font-mono tracking-tight ${
              isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : isExpense
                ? 'text-zinc-900 dark:text-zinc-100'
                : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            {isIncome ? '+' : isExpense ? '-' : '↔ '}
            {formatCurrency(transaction.amountMinor, currency, { showDecimals: true })}
          </div>

          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
            {transaction.type}
          </span>
        </div>

        {/* Breakdown List */}
        <div className="flex flex-col gap-2.5 text-sm">
          {!isTransfer && (
            <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/70">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Category</span>
              <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
                <IconHelper name={category?.icon || 'Tag'} size={16} />
                <span>{category?.name || 'Uncategorized'}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/70">
            <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              {isTransfer ? 'From Account' : 'Account'}
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {sourceAccount?.name || 'Unknown Account'}
            </span>
          </div>

          {isTransfer && (
            <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/70">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">To Account</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {destAccount?.name || 'Unknown Account'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/70">
            <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Date & Time</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200 text-xs">
              {formatFullDate(transaction.date, transaction.time)}
            </span>
          </div>

          {transaction.note && (
            <div className="flex flex-col gap-1 py-1.5 border-b border-zinc-100 dark:border-zinc-800/70">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Note</span>
              <p className="text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl">
                {transaction.note}
              </p>
            </div>
          )}

          {transaction.tags && transaction.tags.length > 0 && (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Tags</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {transaction.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Box */}
        {showDeleteConfirm ? (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Confirm permanent transaction deletion?</span>
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400">
              This will automatically restore the account balance according to financial invariant rules.
            </p>
            <div className="flex items-center gap-2 justify-end mt-1">
              <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={handleDelete}>
                Confirm Delete
              </Button>
            </div>
          </div>
        ) : (
          /* Action Buttons */
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(transaction);
              }}
            >
              <Edit3 className="w-4 h-4 mr-1.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onDuplicate(transaction);
              }}
            >
              <Copy className="w-4 h-4 mr-1.5" /> Copy
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Delete
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
