import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Transaction } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { useTheme } from '../../context/ThemeContext';
import { financeService } from '../../services/financeService';
import { toMinorUnits, toMajorUnits } from '../../utils/currency';
import { getTodayDateString, getCurrentTimeString } from '../../utils/date';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { DateField } from '../ui/DateField';
import { IconHelper } from '../ui/IconHelper';
import { audioService } from '../../services/audioService';
import { Plus } from 'lucide-react-native';
import { cn } from '../../utils/cn';

interface IncomeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

export const IncomeFormModal: React.FC<IncomeFormModalProps> = ({
  isOpen,
  onClose,
  initialTransaction,
}) => {
  const { db } = useDatabase();
  const { resolvedTheme } = useTheme();
  const selectedAccentColor = resolvedTheme === 'dark' ? '#18161D' : '#ffffff';
  const [amountStr, setAmountStr] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  const incomeCategories = Object.values(db.categories)
    .filter((c) => c.type === 'INCOME' && (!c.isArchived || c.id === selectedCategoryId))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const activeAccounts = Object.values(db.accounts).filter(
    (a) => a.isActive || a.id === selectedAccountId
  );

  useEffect(() => {
    if (initialTransaction) {
      setAmountStr(String(toMajorUnits(initialTransaction.amountMinor)));
      setSelectedAccountId(initialTransaction.accountId);
      setSelectedCategoryId(initialTransaction.categoryId || '');
      setDate(initialTransaction.date);
      setTime(initialTransaction.time || getCurrentTimeString());
      setNote(initialTransaction.note || '');
      setTags(initialTransaction.tags || []);
      setShowAdvanced(Boolean(initialTransaction.note || initialTransaction.tags?.length));
    } else {
      setAmountStr('');
      setSelectedAccountId(db.settings.defaultAccountId || activeAccounts[0]?.id || '');
      setSelectedCategoryId(incomeCategories[0]?.id || '');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setNote('');
      setTags([]);
      setShowAdvanced(false);
    }
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTransaction, db.categories, db.accounts]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSubmit = () => {
    const amountMinor = toMinorUnits(amountStr);

    if (amountMinor <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!selectedAccountId) {
      setError('Please select an account');
      return;
    }

    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }

    try {
      if (initialTransaction) {
        financeService.updateTransaction(initialTransaction.id, {
          amountMinor,
          accountId: selectedAccountId,
          categoryId: selectedCategoryId,
          date,
          time,
          note: note.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
      } else {
        financeService.createIncome({
          amountMinor,
          accountId: selectedAccountId,
          categoryId: selectedCategoryId,
          date,
          time,
          note: note.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
      }

      audioService.playSuccessTone();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save income');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTransaction ? 'Edit Income' : 'New Income'}
      maxWidth="sm"
    >
      <View className="flex-col gap-4">
        {/* Amount Input */}
        <View className="flex-col gap-1">
          <Text className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Amount ({db.settings.currency || 'INR'} ₹)
          </Text>
          <View className="relative justify-center">
            <Text className="absolute left-3.5 z-10 text-2xl font-bold text-emerald-500">₹</Text>
            <TextInput
              keyboardType="decimal-pad"
              autoFocus={!initialTransaction}
              value={amountStr}
              onChangeText={(v) => {
                setAmountStr(v);
                setError('');
              }}
              placeholder="0.00"
              placeholderTextColor="#A79D8C"
              className="w-full pl-9 pr-4 py-3 text-2xl font-bold tracking-tight bg-ink-50 dark:bg-ink-800/80 border border-ink-200 dark:border-ink-700 rounded-2xl text-emerald-600 dark:text-emerald-400"
            />
          </View>
        </View>

        {/* Category Selector Grid */}
        <View className="flex-col gap-1.5">
          <Text className="text-xs font-bold uppercase tracking-wider text-ink-500">Income Source</Text>
          <ScrollView
            style={{ maxHeight: 160 }}
            className="p-1 bg-ink-50 dark:bg-ink-800/40 rounded-xl border border-ink-200/60 dark:border-ink-700/60"
          >
            <View className="flex-row flex-wrap gap-2">
              {incomeCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    className={cn(
                      'items-center justify-center p-2 rounded-xl',
                      isSelected ? 'bg-emerald-600' : 'active:bg-ink-200/60 dark:active:bg-ink-700/60'
                    )}
                    style={{ width: '23%' }}
                  >
                    <IconHelper name={cat.icon} size={18} color={isSelected ? '#ffffff' : '#8A8680'} />
                    <Text
                      numberOfLines={1}
                      className={cn(
                        'text-[11px] font-medium mt-1 text-center',
                        isSelected ? 'text-white' : 'text-ink-700 dark:text-ink-300'
                      )}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Account Selector */}
        <View className="flex-col gap-1.5">
          <Text className="text-xs font-bold uppercase tracking-wider text-ink-500">Deposit Into Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-center gap-2 pb-1">
              {activeAccounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <Pressable
                    key={acc.id}
                    onPress={() => setSelectedAccountId(acc.id)}
                    className={cn(
                      'px-3 py-2 rounded-xl flex-row items-center gap-1.5 border',
                      isSelected
                        ? 'bg-ink-900 border-ink-900 dark:bg-ink-100 dark:border-ink-100'
                        : 'bg-ink-50 dark:bg-ink-800 border-ink-200 dark:border-ink-700'
                    )}
                  >
                    <IconHelper name={acc.icon} size={14} color={isSelected ? selectedAccentColor : '#8A8680'} />
                    <Text className={cn('text-xs font-medium', isSelected ? 'text-white dark:text-ink-900' : 'text-ink-700 dark:text-ink-300')}>
                      {acc.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Optional Advanced Details */}
        <Pressable onPress={() => setShowAdvanced(!showAdvanced)} className="self-start mt-1">
          <Text className="text-xs font-medium text-ink-500">
            {showAdvanced ? '− Hide Details' : '+ Add Note, Date & Tags'}
          </Text>
        </Pressable>

        {showAdvanced && (
          <View className="flex-col gap-3 pt-2 border-t border-ink-100 dark:border-ink-800">
            <View className="flex-row gap-2">
              <View className="flex-1">
                <DateField mode="date" label="Date" value={date} onChange={setDate} />
              </View>
              <View className="flex-1">
                <DateField mode="time" label="Time" value={time} onChange={setTime} />
              </View>
            </View>

            <Input
              label="Note / Description"
              placeholder="e.g., August Salary Bonus, Freelance Milestone"
              value={note}
              onChangeText={setNote}
            />

            {/* Tags */}
            <View className="flex-col gap-1.5">
              <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">Tags</Text>
              <View className="flex-row items-center gap-1.5">
                <TextInput
                  placeholder="e.g. Salary, Client"
                  placeholderTextColor="#A79D8C"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                  className="flex-1 px-3 py-2 rounded-lg bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-xs text-ink-900 dark:text-ink-100"
                />
                <Button size="sm" variant="secondary" onPress={handleAddTag}>
                  <Plus size={14} color="#4A443B" />
                </Button>
              </View>
            </View>
          </View>
        )}

        {error ? <Text className="text-xs text-rose-500 font-semibold">{error}</Text> : null}

        {/* Submit */}
        <View className="flex-row items-center justify-end gap-2 pt-2 border-t border-ink-100 dark:border-ink-800">
          <Button variant="ghost" onPress={onClose}>
            <Text className={buttonTextColor.ghost}>Cancel</Text>
          </Button>
          <Button variant="primary" onPress={handleSubmit}>
            <Text className={buttonTextColor.primary}>{initialTransaction ? 'Update Income' : 'Save Income'}</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
};
