import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Switch } from 'react-native';
import { RecurringTransaction, RecurringFrequency, TransactionType } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { recurringRepository } from '../../database/repositories/recurringRepo';
import { financeService } from '../../services/financeService';
import { formatCurrency, toMinorUnits, toMajorUnits } from '../../utils/currency';
import { getTodayDateString } from '../../utils/date';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DateField } from '../ui/DateField';
import { IconHelper } from '../ui/IconHelper';
import { Plus, Repeat, Play, Trash2, Bell, Pencil } from 'lucide-react-native';
import { audioService } from '../../services/audioService';
import { notificationService } from '../../services/notificationService';
import { cn } from '../../utils/cn';
import { ink } from '../../utils/theme';

const REMINDER_DAYS_OPTIONS: { label: string; value: string }[] = [
  { label: '1 day before', value: '1' },
  { label: '3 days before', value: '3' },
  { label: '7 days before', value: '7' },
];

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
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    setReminderEnabled(false);
    setReminderDaysBefore(3);
    setEditingId(null);
    setIsCreating(true);
    setError('');
  };

  const handleStartEdit = (r: RecurringTransaction) => {
    setType(r.type);
    setAmountStr(String(toMajorUnits(r.amountMinor)));
    setAccountId(r.accountId);
    setCategoryId(r.categoryId || '');
    setFrequency(r.frequency);
    setNote(r.note || '');
    setNextDueDate(r.nextDueDate);
    setReminderEnabled(!!r.reminderEnabled);
    setReminderDaysBefore(r.reminderDaysBefore || 3);
    setEditingId(r.id);
    setIsCreating(true);
    setError('');
  };

  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      const granted = await notificationService.requestPermission();
      if (!granted) {
        Alert.alert('Notifications disabled', 'Enable notifications in system settings to receive bill reminders.');
      }
    }
    setReminderEnabled(value);
  };

  // Fires the reminder at 9 AM local time, `daysBefore` days ahead of the due date.
  const computeReminderDate = (dueDateStr: string, daysBefore: number): Date => {
    const [y, m, d] = dueDateStr.split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1, 9, 0, 0, 0);
    date.setDate(date.getDate() - daysBefore);
    return date;
  };

  const handleSave = async () => {
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
      const label = note.trim() || categories.find((c) => c.id === categoryId)?.name || 'Recurring Payment';
      const existing = editingId ? recurringRepository.getById(editingId) : undefined;

      // Cancel-then-reschedule: never leave two live schedules for the same rule.
      if (existing?.reminderNotificationId) {
        await notificationService.cancel(existing.reminderNotificationId);
      }

      let reminderNotificationId: string | undefined;
      if (reminderEnabled) {
        const fireDate = computeReminderDate(nextDueDate, reminderDaysBefore);
        const identifier = `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const scheduled = await notificationService.scheduleAt(
          identifier,
          'Upcoming Bill',
          `${label} is due on ${nextDueDate}`,
          fireDate
        );
        reminderNotificationId = scheduled || undefined;
      }

      if (editingId) {
        recurringRepository.update(editingId, {
          type,
          amountMinor,
          accountId,
          categoryId: categoryId || undefined,
          frequency,
          note: note.trim() || undefined,
          nextDueDate,
          reminderEnabled,
          reminderDaysBefore: reminderEnabled ? reminderDaysBefore : undefined,
          reminderNotificationId,
        });
      } else {
        const created = recurringRepository.create({
          type,
          amountMinor,
          accountId,
          categoryId: categoryId || undefined,
          frequency,
          note: note.trim() || undefined,
          startDate: getTodayDateString(),
          nextDueDate,
        });

        if (reminderEnabled) {
          recurringRepository.update(created.id, {
            reminderEnabled: true,
            reminderDaysBefore,
            reminderNotificationId,
          });
        }
      }

      audioService.playSuccessTone();
      setIsCreating(false);
      setEditingId(null);
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
          const existing = recurringRepository.getById(id);
          if (existing?.reminderNotificationId) {
            notificationService.cancel(existing.reminderNotificationId);
          }
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
      title={isCreating ? (editingId ? 'Edit Recurring Rule' : 'New Recurring Rule') : 'Scheduled & Subscriptions'}
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
                    ? 'bg-ink-900 border-ink-900 dark:bg-ink-100 dark:border-ink-100'
                    : 'bg-ink-50 dark:bg-ink-800 border-ink-200 dark:border-ink-700'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-semibold',
                    type === t ? 'text-white dark:text-ink-900' : 'text-ink-600 dark:text-ink-400'
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

          <View className="flex-col gap-3 p-3 rounded-3xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200/70 dark:border-ink-800">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Bell size={16} color={ink[500]} />
                <Text className="text-xs font-semibold text-ink-800 dark:text-ink-200">
                  Remind me before it's due
                </Text>
              </View>
              <Switch value={reminderEnabled} onValueChange={handleToggleReminder} />
            </View>

            {reminderEnabled && (
              <Select
                label="Remind"
                value={String(reminderDaysBefore)}
                onChange={(v) => setReminderDaysBefore(Number(v))}
                options={REMINDER_DAYS_OPTIONS}
              />
            )}
          </View>

          {error ? <Text className="text-xs text-rose-500 font-semibold">{error}</Text> : null}

          <View className="flex-row items-center justify-end gap-2 pt-2 border-t border-ink-100 dark:border-ink-800">
            <Button
              variant="ghost"
              onPress={() => {
                setIsCreating(false);
                setEditingId(null);
              }}
            >
              <Text className={buttonTextColor.ghost}>Back</Text>
            </Button>
            <Button variant="primary" onPress={handleSave}>
              <Text className={buttonTextColor.primary}>{editingId ? 'Update Rule' : 'Save Recurring Rule'}</Text>
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-col gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-ink-500 font-medium">{recurringList.length} Scheduled Rules</Text>
            <Button size="sm" onPress={handleStartCreate}>
              <Plus size={16} color="#ffffff" />
              <Text className={buttonTextColor.primary}>Add Rule</Text>
            </Button>
          </View>

          {recurringList.length === 0 ? (
            <View className="py-8 items-center bg-ink-50 dark:bg-ink-800/30 rounded-3xl border border-ink-200/60 dark:border-ink-800">
              <Repeat size={32} color={ink[400]} />
              <Text className="text-xs text-ink-500 mt-2 text-center px-4">
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
                      className="flex-row items-center justify-between p-3 rounded-3xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200/70 dark:border-ink-800"
                    >
                      <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-2">
                        <View className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                          <IconHelper name={cat?.icon || 'Repeat'} size={18} color="#2563eb" />
                        </View>
                        <View className="flex-col min-w-0">
                          <Text numberOfLines={1} className="text-xs font-semibold text-ink-900 dark:text-ink-100">
                            {r.note || cat?.name || 'Recurring Payment'}
                          </Text>
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-[11px] text-ink-500">{r.frequency}</Text>
                            <Text className="text-[11px] text-ink-500">• {acc?.name || 'Account'}</Text>
                            <Text className="text-[11px] text-ink-500">• Due: {r.nextDueDate}</Text>
                            {r.reminderEnabled && <Bell size={11} color={ink[500]} />}
                          </View>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2 shrink-0">
                        <Text className="text-xs font-bold text-ink-900 dark:text-ink-100">
                          {formatCurrency(r.amountMinor, db.settings.currency)}
                        </Text>
                        <Button size="sm" variant="secondary" onPress={() => handleExecuteNow(r)}>
                          <Play size={12} color="#059669" />
                          <Text className={cn(buttonTextColor.secondary, 'text-[11px]')}>Log</Text>
                        </Button>
                        <Pressable onPress={() => handleStartEdit(r)} className="p-1.5 rounded-lg active:bg-ink-200/60 dark:active:bg-ink-700">
                          <Pencil size={16} color={ink[400]} />
                        </Pressable>
                        <Pressable onPress={() => handleDelete(r.id)} className="p-1.5 rounded-lg active:bg-ink-200/60 dark:active:bg-ink-700">
                          <Trash2 size={16} color={ink[400]} />
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
