import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SavingsGoal } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { useTheme } from '../../context/ThemeContext';
import { goalRepository } from '../../database/repositories/goalRepo';
import { formatCurrency, toMinorUnits, toMajorUnits } from '../../utils/currency';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { DateField } from '../ui/DateField';
import { IconHelper } from '../ui/IconHelper';
import { AnimatedBar } from '../ui/AnimatedBar';
import { Plus, Edit2, Check, Trash2, PiggyBank, X } from 'lucide-react-native';
import { audioService } from '../../services/audioService';

interface GoalsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GOAL_ICONS = ['PiggyBank', 'Plane', 'Home', 'Car', 'GraduationCap', 'Heart', 'Gift', 'Smartphone'];
const GOAL_COLORS = ['#2563eb', '#059669', '#4f46e5', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#475569'];

export const GoalsManagerModal: React.FC<GoalsManagerModalProps> = ({ isOpen, onClose }) => {
  const { db } = useDatabase();
  const { resolvedTheme } = useTheme();
  const selectedAccentColor = resolvedTheme === 'dark' ? '#18181b' : '#ffffff';
  const [isCreating, setIsCreating] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [contributionStr, setContributionStr] = useState('');

  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined);
  const [icon, setIcon] = useState('PiggyBank');
  const [color, setColor] = useState('#2563eb');
  const [error, setError] = useState('');

  const goals = goalRepository.getAll();

  const handleStartCreate = () => {
    setName('');
    setTargetAmountStr('');
    setTargetDate(undefined);
    setIcon('PiggyBank');
    setColor('#2563eb');
    setEditingGoalId(null);
    setIsCreating(true);
    setError('');
  };

  const handleStartEdit = (goal: SavingsGoal) => {
    setName(goal.name);
    setTargetAmountStr(String(toMajorUnits(goal.targetAmountMinor)));
    setTargetDate(goal.targetDate);
    setIcon(goal.icon);
    setColor(goal.color);
    setEditingGoalId(goal.id);
    setIsCreating(true);
    setError('');
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Goal name is required');
      return;
    }

    const targetMinor = toMinorUnits(targetAmountStr);
    if (targetMinor <= 0) {
      setError('Please enter a valid target amount');
      return;
    }

    try {
      if (editingGoalId) {
        goalRepository.update(editingGoalId, {
          name: name.trim(),
          targetAmountMinor: targetMinor,
          targetDate,
          icon,
          color,
        });
      } else {
        goalRepository.create({
          name: name.trim(),
          targetAmountMinor: targetMinor,
          targetDate,
          icon,
          color,
        });
      }

      audioService.playSuccessTone();
      setIsCreating(false);
      setEditingGoalId(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to save savings goal');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete savings goal?', 'This will permanently remove this goal and its progress.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          goalRepository.delete(id);
          audioService.triggerHaptic('light');
        },
      },
    ]);
  };

  const handleStartContribute = (id: string) => {
    setContributingId(id);
    setContributionStr('');
  };

  const handleConfirmContribute = (id: string) => {
    const amountMinor = toMinorUnits(contributionStr);
    if (amountMinor <= 0) {
      setContributingId(null);
      return;
    }
    goalRepository.addContribution(id, amountMinor);
    audioService.playSuccessTone();
    setContributingId(null);
    setContributionStr('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreating ? (editingGoalId ? 'Edit Savings Goal' : 'New Savings Goal') : 'Manage Savings Goals'}
      maxWidth="md"
    >
      {isCreating ? (
        <View className="flex-col gap-4">
          <Input
            label="Goal Name"
            placeholder="e.g., Emergency Fund, Japan Trip, New Laptop"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                label="Target Amount (₹)"
                keyboardType="decimal-pad"
                value={targetAmountStr}
                onChangeText={setTargetAmountStr}
                placeholder="0.00"
              />
            </View>
            <View className="flex-1">
              <DateField mode="date" label="Target Date (optional)" value={targetDate} onChange={setTargetDate} />
            </View>
          </View>

          {/* Color & Icon Picker */}
          <View className="flex-col gap-1.5">
            <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Icon & Color</Text>
            <View className="flex-row items-center gap-2 flex-wrap mb-2">
              {GOAL_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={14} color="#ffffff" />}
                </Pressable>
              ))}
            </View>

            <View className="flex-row items-center gap-2 flex-wrap">
              {GOAL_ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  className={
                    icon === ic
                      ? 'p-2 rounded-xl border border-transparent bg-zinc-900 dark:bg-zinc-100'
                      : 'p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800'
                  }
                >
                  <IconHelper name={ic} size={18} color={icon === ic ? selectedAccentColor : '#71717a'} />
                </Pressable>
              ))}
            </View>
          </View>

          {error ? <Text className="text-xs text-rose-500 font-semibold">{error}</Text> : null}

          <View className="flex-row items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="ghost" onPress={() => setIsCreating(false)}>
              <Text className={buttonTextColor.ghost}>Back</Text>
            </Button>
            <Button variant="primary" onPress={handleSave}>
              <Text className={buttonTextColor.primary}>{editingGoalId ? 'Save Changes' : 'Create Goal'}</Text>
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-col gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-zinc-500 font-medium">{goals.length} Savings Goals</Text>
            <Button size="sm" onPress={handleStartCreate}>
              <Plus size={16} color="#ffffff" />
              <Text className={buttonTextColor.primary}>Add Goal</Text>
            </Button>
          </View>

          {goals.length === 0 ? (
            <View className="py-8 items-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
              <PiggyBank size={32} color="#a1a1aa" />
              <Text className="text-xs text-zinc-500 mt-2 text-center px-4">
                No savings goals yet. Start tracking a trip, emergency fund, or a big purchase.
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 420 }}>
              <View className="flex-col gap-2">
                {goals.map((goal) => {
                  const percent = goal.targetAmountMinor > 0 ? (goal.savedAmountMinor / goal.targetAmountMinor) * 100 : 0;
                  const isContributing = contributingId === goal.id;
                  return (
                    <View
                      key={goal.id}
                      className="flex-col gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-2">
                          <View
                            className="w-10 h-10 rounded-xl items-center justify-center shrink-0"
                            style={{ backgroundColor: goal.color }}
                          >
                            <IconHelper name={goal.icon} size={20} color="#ffffff" />
                          </View>
                          <View className="flex-col min-w-0 flex-1">
                            <Text numberOfLines={1} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {goal.name}
                            </Text>
                            <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              {formatCurrency(goal.savedAmountMinor, db.settings.currency)} saved of{' '}
                              {formatCurrency(goal.targetAmountMinor, db.settings.currency)}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-1 shrink-0">
                          <Pressable
                            onPress={() => handleStartContribute(goal.id)}
                            className="p-1.5 active:bg-zinc-200/60 dark:active:bg-zinc-700 rounded-lg"
                          >
                            <Plus size={16} color="#16a34a" />
                          </Pressable>
                          <Pressable onPress={() => handleStartEdit(goal)} className="p-1.5 active:bg-zinc-200/60 dark:active:bg-zinc-700 rounded-lg">
                            <Edit2 size={16} color="#71717a" />
                          </Pressable>
                          <Pressable onPress={() => handleDelete(goal.id)} className="p-1.5 active:bg-zinc-200/60 dark:active:bg-zinc-700 rounded-lg">
                            <Trash2 size={16} color="#a1a1aa" />
                          </Pressable>
                        </View>
                      </View>

                      <AnimatedBar
                        percent={Math.min(100, percent)}
                        trackClassName="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full"
                        fillColor={goal.color}
                      />

                      {isContributing && (
                        <View className="flex-row items-center gap-2">
                          <View className="flex-1">
                            <Input
                              placeholder="Amount to add (₹)"
                              keyboardType="decimal-pad"
                              value={contributionStr}
                              onChangeText={setContributionStr}
                              autoFocus
                            />
                          </View>
                          <Pressable
                            onPress={() => handleConfirmContribute(goal.id)}
                            className="p-2.5 rounded-xl bg-emerald-600 active:bg-emerald-700"
                          >
                            <Check size={18} color="#ffffff" />
                          </Pressable>
                          <Pressable
                            onPress={() => setContributingId(null)}
                            className="p-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 active:bg-zinc-300 dark:active:bg-zinc-600"
                          >
                            <X size={18} color="#71717a" />
                          </Pressable>
                        </View>
                      )}
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
