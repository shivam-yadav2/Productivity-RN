import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Transaction } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { financeService } from '../../services/financeService';
import { formatCurrency } from '../../utils/currency';
import { formatFullDate } from '../../utils/date';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { IconHelper } from '../ui/IconHelper';
import { Trash2, Copy, Edit3, ArrowLeftRight, AlertTriangle } from 'lucide-react-native';
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
  const [deleteError, setDeleteError] = useState('');

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
      setDeleteError(e?.message || 'Failed to delete transaction.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction Details" maxWidth="sm">
      <View className="flex-col gap-5">
        {/* Amount & Type Hero Card */}
        <View className="items-center justify-center p-5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/70 dark:border-zinc-800">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center mb-2 border"
            style={{
              backgroundColor: isTransfer ? '#eff6ff' : isIncome ? '#f0fdf4' : `${category?.color || '#f43f5e'}15`,
              borderColor: isTransfer ? '#bfdbfe' : isIncome ? '#bbf7d0' : `${category?.color || '#f43f5e'}30`,
            }}
          >
            {isTransfer ? (
              <ArrowLeftRight size={24} color="#2563eb" />
            ) : (
              <IconHelper
                name={category?.icon || (isIncome ? 'Coins' : 'Tag')}
                size={24}
                color={isIncome ? '#16a34a' : category?.color || '#e11d48'}
              />
            )}
          </View>

          <Text
            className={
              isIncome
                ? 'text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400'
                : isExpense
                ? 'text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100'
                : 'text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400'
            }
          >
            {isIncome ? '+' : isExpense ? '-' : '↔ '}
            {formatCurrency(transaction.amountMinor, currency, { showDecimals: true })}
          </Text>

          <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
            {transaction.type}
          </Text>
        </View>

        {/* Breakdown List */}
        <View className="flex-col gap-2.5">
          {!isTransfer && (
            <View className="flex-row items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/70">
              <Text className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Category</Text>
              <View className="flex-row items-center gap-1.5">
                <IconHelper name={category?.icon || 'Tag'} size={16} color="#71717a" />
                <Text className="font-medium text-zinc-900 dark:text-zinc-100">
                  {category?.name || 'Uncategorized'}
                </Text>
              </View>
            </View>
          )}

          <View className="flex-row items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/70">
            <Text className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              {isTransfer ? 'From Account' : 'Account'}
            </Text>
            <Text className="font-medium text-zinc-900 dark:text-zinc-100">
              {sourceAccount?.name || 'Unknown Account'}
            </Text>
          </View>

          {isTransfer && (
            <View className="flex-row items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/70">
              <Text className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">To Account</Text>
              <Text className="font-medium text-zinc-900 dark:text-zinc-100">
                {destAccount?.name || 'Unknown Account'}
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/70">
            <Text className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Date & Time</Text>
            <Text className="font-medium text-zinc-800 dark:text-zinc-200 text-xs">
              {formatFullDate(transaction.date, transaction.time)}
            </Text>
          </View>

          {transaction.note && (
            <View className="flex-col gap-1 py-1.5 border-b border-zinc-100 dark:border-zinc-800/70">
              <Text className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Note</Text>
              <Text className="text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl">
                {transaction.note}
              </Text>
            </View>
          )}

          {transaction.tags && transaction.tags.length > 0 && (
            <View className="flex-row items-center justify-between py-1.5">
              <Text className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Tags</Text>
              <View className="flex-row items-center gap-1.5 flex-wrap">
                {transaction.tags.map((t) => (
                  <View key={t} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                    <Text className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">#{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Delete Confirmation Box */}
        {showDeleteConfirm ? (
          <View className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex-col gap-2.5">
            <View className="flex-row items-center gap-2">
              <AlertTriangle size={16} color="#be123c" />
              <Text className="text-rose-700 dark:text-rose-300 text-xs font-semibold flex-1">
                Confirm permanent transaction deletion?
              </Text>
            </View>
            <Text className="text-[11px] text-rose-600 dark:text-rose-400">
              This will automatically restore the account balance according to financial invariant rules.
            </Text>
            {deleteError ? (
              <Text className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">{deleteError}</Text>
            ) : null}
            <View className="flex-row items-center gap-2 justify-end mt-1">
              <Button size="sm" variant="ghost" onPress={() => setShowDeleteConfirm(false)}>
                <Text className={buttonTextColor.ghost}>Cancel</Text>
              </Button>
              <Button size="sm" variant="danger" onPress={handleDelete}>
                <Text className={buttonTextColor.danger}>Confirm Delete</Text>
              </Button>
            </View>
          </View>
        ) : (
          /* Action Buttons */
          <View className="flex-row gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onPress={() => {
                onClose();
                onEdit(transaction);
              }}
            >
              <Edit3 size={16} color="#27272a" />
              <Text className={buttonTextColor.outline}>Edit</Text>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onPress={() => {
                onClose();
                onDuplicate(transaction);
              }}
            >
              <Copy size={16} color="#27272a" />
              <Text className={buttonTextColor.outline}>Copy</Text>
            </Button>
            <Button variant="danger" size="sm" className="flex-1" onPress={() => setShowDeleteConfirm(true)}>
              <Trash2 size={16} color="#ffffff" />
              <Text className={buttonTextColor.danger}>Delete</Text>
            </Button>
          </View>
        )}
      </View>
    </Modal>
  );
};
