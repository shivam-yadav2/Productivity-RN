import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useDatabase } from '../../context/DatabaseContext';
import { budgetRepository } from '../../database/repositories/budgetRepo';
import { toMinorUnits, formatCurrency } from '../../utils/currency';
import { getMonthYearKey, formatMonthYear } from '../../utils/date';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { IconHelper } from '../ui/IconHelper';
import { Trash2, Plus } from 'lucide-react-native';
import { audioService } from '../../services/audioService';

interface BudgetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetManagerModal: React.FC<BudgetManagerModalProps> = ({ isOpen, onClose }) => {
  const { db } = useDatabase();
  const currentMonthKey = getMonthYearKey();

  const [selectedCategory, setSelectedCategory] = useState<string>('overall');
  const [limitStr, setLimitStr] = useState('');
  const [error, setError] = useState('');

  const expenseCategories = Object.values(db.categories).filter((c) => c.type === 'EXPENSE');
  const currentBudgets = Object.values(db.budgets).filter((b) => b.monthKey === currentMonthKey);

  const categoryOptions = [
    { label: 'Total Overall Monthly', value: 'overall' },
    ...expenseCategories.map((cat) => ({ label: cat.name, value: cat.id })),
  ];

  const handleSaveBudget = () => {
    const limitMinor = toMinorUnits(limitStr);
    if (limitMinor <= 0) {
      setError('Please enter a budget limit greater than 0');
      return;
    }

    try {
      budgetRepository.setBudget({
        monthKey: currentMonthKey,
        categoryId: selectedCategory === 'overall' ? null : selectedCategory,
        limitMinor,
      });

      audioService.playSuccessTone();
      setLimitStr('');
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to save budget');
    }
  };

  const handleDeleteBudget = (id: string) => {
    budgetRepository.deleteBudget(id);
    audioService.triggerHaptic('light');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Budgets for ${formatMonthYear(currentMonthKey)}`} maxWidth="md">
      <View className="flex-col gap-5">
        {/* Set / Update Form */}
        <View className="flex-col gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/70 dark:border-zinc-800">
          <Text className="text-xs font-bold uppercase tracking-wider text-zinc-500">Set Monthly Limit</Text>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Select label="Target Category" value={selectedCategory} onChange={setSelectedCategory} options={categoryOptions} />
            </View>
            <View className="flex-1">
              <Input
                label="Limit Amount (₹)"
                keyboardType="decimal-pad"
                placeholder="e.g. 5000"
                value={limitStr}
                onChangeText={setLimitStr}
              />
            </View>
          </View>

          {error ? <Text className="text-xs text-rose-500 font-semibold">{error}</Text> : null}

          <Button size="sm" className="self-end mt-1" onPress={handleSaveBudget}>
            <Plus size={16} color="#ffffff" />
            <Text className={buttonTextColor.primary}>Save Budget</Text>
          </Button>
        </View>

        {/* Existing Budgets List */}
        <View className="flex-col gap-2">
          <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Configured Budgets ({currentBudgets.length})
          </Text>

          {currentBudgets.length === 0 ? (
            <Text className="text-xs text-zinc-500 py-4 text-center">No budgets configured for this month.</Text>
          ) : (
            <ScrollView className="max-h-52">
              <View className="flex-col gap-2">
                {currentBudgets.map((b) => {
                  const cat = b.categoryId ? db.categories[b.categoryId] : undefined;
                  return (
                    <View
                      key={b.id}
                      className="flex-row items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800"
                    >
                      <View className="flex-row items-center gap-2.5">
                        <View className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 items-center justify-center">
                          <IconHelper name={cat?.icon || 'PiggyBank'} size={16} color="#3f3f46" />
                        </View>
                        <View className="flex-col">
                          <Text className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {cat?.name || 'Total Monthly Budget'}
                          </Text>
                          <Text className="text-xs font-medium text-zinc-500">
                            Limit: {formatCurrency(b.limitMinor, db.settings.currency)}
                          </Text>
                        </View>
                      </View>

                      <Pressable onPress={() => handleDeleteBudget(b.id)} className="p-1.5">
                        <Trash2 size={16} color="#a1a1aa" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};
