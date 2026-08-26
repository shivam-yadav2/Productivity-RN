import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { RecurringTransaction, RecurringFrequency, TransactionType } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { recurringRepository } from '../../database/repositories/recurringRepo';
import { financeService } from '../../services/financeService';
import { formatCurrency, toMinorUnits } from '../../utils/currency';
import { getTodayDateString } from '../../utils/date';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DateField } from '../ui/DateField';
import { IconHelper } from '../ui/IconHelper';
import { Plus, Repeat, Play, Trash2 } from 'lucide-react-native';
import { audioService } from '../../services/audioService';
import { cn } from '../../utils/cn';

interface RecurringManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FREQUENCY_OPTIONS: { label: string; value: RecurringFrequency }[] = [
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Yearly', value: 'YEARLY' },
];

export const RecurringManagerModal: React.FC<RecurringManagerModalProps> = ({ isOpen, onClose }) => {
  const { db } = useDatabase();
  const [isCreating, setIsCreating] = useState(false);

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [note, setNote] = useState('');
  const [nextDueDate, setNextDueDate] = useState(getTodayDateString());
  const [error, setError] = useState('');

  const recurringList = Object.values(db.recurringTransactions);
  const categories = Object.values(db.categories).filter((c) => c.type === type);
  const activeAccounts = Object.values(db.accounts).filter((a) => a.isActive);

  const accountOptions = activeAccounts.map((a) => ({ label: a.name, value: a.id }));
  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));

  const handleStartCreate = () => {
    setType('EXPENSE');
    setAmountStr('');
    setAccountId(activeAccounts[0]?.id || '');
    setCategoryId(categories[0]?.id || '');
    setFrequency('MONTHLY');
    setNote('');
    setNextDueDate(getTodayDateString());
    setIsCreating(true);
    setError('');
  };

  const handleSave = () => {
    const amountMinor = toMinorUnits(amountStr);
    if (amountMinor <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!accountId) {
      setError('Please select an account');
      return;
    }

    try {
      recurringRepository.create({
        type,
        amountMinor,
        accountId,
        categoryId: categoryId || undefined,
        frequency,
        note: note.trim() || undefined,
        startDate: getTodayDateString(),
        nextDueDate,
      });

      audioService.playSuccessTone();
      setIsCreating(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create recurring transaction');
    }
  };

  // Convert recurring rule into immediate ledger transaction
  const handleExecuteNow = (r: RecurringTransaction) => {
    try {
      if (r.type === 'EXPENSE') {
        financeService.createExpense({
          amountMinor: r.amountMinor,
          accountId: r.accountId,
          categoryId: r.categoryId || '',
          date: getTodayDateString(),
          note: `[Recurring] ${r.note || ''}`.trim(),
        });
      } else if (r.type === 'INCOME') {
        financeService.createIncome({
          amountMinor: r.amountMinor,
          accountId: r.accountId,
          categoryId: r.categoryId || '',
          date: getTodayDateString(),
          note: `[Recurring] ${r.note || ''}`.trim(),
        });
      }

      // Advance next due date based on frequency
      const d = new Date(r.nextDueDate);
      if (r.frequency === 'DAILY') d.setDate(d.getDate() + 1);
      else if (r.frequency === 'WEEKLY') d.setDate(d.getDate() + 7);
      else if (r.frequency === 'MONTHLY') d.setMonth(d.getMonth() + 1);
      else if (r.frequency === 'YEARLY') d.setFullYear(d.getFullYear() + 1);

      const nextStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      recurringRepository.update(r.id, { nextDueDate: nextStr });

      audioService.playSuccessTone();
    } catch (err: any) {
      Alert.alert('Failed to record transaction', err?.message || 'Please try again.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete recurring rule?', 'This will stop tracking this scheduled payment.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          recurringRepository.delete(id);
          audioService.triggerHaptic('light');
        },
      },
    ]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreating ? 'New Recurring Rule' : 'Scheduled & Subscriptions'}
      maxWidth="md"
    >
      {isCreating ? (
        <View className="flex-col gap-4">
          <View className="flex-row items-center gap-2">
            {(['EXPENSE', 'INCOME'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => {
                  setType(t);
                  const firstCat = Object.values(db.categories).find((c) => c.type === t);
                  setCategoryId(firstCat?.id || '');
                }}
                className={cn(
                  'flex-1 py-2 rounded-xl items-center border',
                  type === t
                    ? 'bg-zinc-900 border-zinc-900 dark:bg-zinc-100 dark:border-zinc-100'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-semibold',
                    type === t ? 'text-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-400'
                  )}
                >
                  Recurring {t}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                label="Amount (₹)"
                keyboardType="decimal-pad"
                value={amountStr}
                onChangeText={setAmountStr}
                placeholder="0.00"
                autoFocus
              />
            </View>
            <View className="flex-1">
              <Select label="Frequency" value={frequency} onChange={(v) => setFrequency(v as RecurringFrequency)} options={FREQUENCY_OPTIONS} />
            </View>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Select label="Account" value={accountId} onChange={setAccountId} options={accountOptions} />
            </View>
            <View className="flex-1">
              <Select label="Category" value={categoryId} onChange={setCategoryId} options={categoryOptions} />
            </View>
          </View>

          <Input
            label="Rule Label / Note"
            placeholder="e.g. Netflix Premium, House Rent, SIP Investment"
            value={note}
            onChangeText={setNote}
          />

          <DateField mode="date" label="First / Next Due Date" value={nextDueDate} onChange={setNextDueDate} />

          {error ? <Text className="text-xs text-rose-500 font-semibold">{error}</Text> : null}

          <View className="flex-row items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="ghost" onPress={() => setIsCreating(false)}>
              <Text className={buttonTextColor.ghost}>Back</Text>
            </Button>
            <Button variant="primary" onPress={handleSave}>
              <Text className={buttonTextColor.primary}>Save Recurring Rule</Text>
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-col gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-zinc-500 font-medium">{recurringList.length} Scheduled Rules</Text>
            <Button size="sm" onPress={handleStartCreate}>
              <Plus size={16} color="#ffffff" />
              <Text className={buttonTextColor.primary}>Add Rule</Text>
            </Button>
          </View>

          {recurringList.length === 0 ? (
            <View className="py-8 items-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
              <Repeat size={32} color="#a1a1aa" />
              <Text className="text-xs text-zinc-500 mt-2 text-center px-4">
                No recurring rules yet. Track Netflix, Rent, EMI, and Subscriptions.
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 420 }}>
              <View className="flex-col gap-2">
                {recurringList.map((r) => {
                  const cat = r.categoryId ? db.categories[r.categoryId] : undefined;
                  const acc = db.accounts[r.accountId];
                  return (
                    <View
                      key={r.id}
                      className="flex-row items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800"
                    >
                      <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-2">
                        <View className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                          <IconHelper name={cat?.icon || 'Repeat'} size={18} color="#2563eb" />
                        </View>
                        <View className="flex-col min-w-0">
                          <Text numberOfLines={1} className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {r.note || cat?.name || 'Recurring Payment'}
                          </Text>
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-[11px] text-zinc-500">{r.frequency}</Text>
                            <Text className="text-[11px] text-zinc-500">• {acc?.name || 'Account'}</Text>
                            <Text className="text-[11px] text-zinc-500">• Due: {r.nextDueDate}</Text>
                          </View>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2 shrink-0">
                        <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(r.amountMinor, db.settings.currency)}
                        </Text>
                        <Button size="sm" variant="secondary" onPress={() => handleExecuteNow(r)}>
                          <Play size={12} color="#059669" />
                          <Text className={cn(buttonTextColor.secondary, 'text-[11px]')}>Log</Text>
                        </Button>
                        <Pressable onPress={() => handleDelete(r.id)} className="p-1.5 rounded-lg active:bg-zinc-200/60 dark:active:bg-zinc-700">
                          <Trash2 size={16} color="#a1a1aa" />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </Modal>
  );
};
