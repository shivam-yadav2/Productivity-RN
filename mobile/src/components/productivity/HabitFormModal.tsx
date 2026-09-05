import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, useColorScheme, Alert } from 'react-native';
import { Habit } from '../../types';
import { habitRepository } from '../../database/repositories/habitRepo';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconHelper } from '../ui/IconHelper';
import { DateField } from '../ui/DateField';
import { Trash2, Bell, Plus, X } from 'lucide-react-native';
import { audioService } from '../../services/audioService';
import { notificationService } from '../../services/notificationService';
import { cn } from '../../utils/cn';
import { ink } from '../../utils/theme';

const MAX_REMINDERS = 5;

interface HabitFormModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
}

const HABIT_ICONS = [
  'Flame', 'Dumbbell', 'Brain', 'BookOpen', 'GlassWater', 'Heart',
  'Moon', 'Smile', 'Sun', 'Target', 'Coffee', 'Laptop', 'CheckCircle2',
];

const HABIT_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#14b8a6', '#6366f1', '#06b6d4', '#64748b',
];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({ habit, isOpen, onClose }) => {
  const isDark = useColorScheme() === 'dark';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Flame');
  const [color, setColor] = useState('#f59e0b');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(7);
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || '');
      setIcon(habit.icon);
      setColor(habit.color);
      setTargetDaysPerWeek(habit.targetDaysPerWeek);
      setReminderTimes(habit.reminderTimes || []);
    } else {
      setName('');
      setDescription('');
      setIcon('Flame');
      setColor('#f59e0b');
      setTargetDaysPerWeek(7);
      setReminderTimes([]);
    }
    setError('');
  }, [habit, isOpen]);

  const handleAddReminder = async () => {
    if (reminderTimes.length >= MAX_REMINDERS) return;
    if (reminderTimes.length === 0) {
      const granted = await notificationService.requestPermission();
      if (!granted) {
        Alert.alert('Notifications disabled', 'Enable notifications in system settings to get habit reminders.');
        return;
      }
    }
    setReminderTimes((prev) => [...prev, '09:00']);
  };

  const handleChangeReminder = (index: number, value: string) => {
    setReminderTimes((prev) => prev.map((t, i) => (i === index ? value : t)));
  };

  const handleRemoveReminder = (index: number) => {
    setReminderTimes((prev) => prev.filter((_, i) => i !== index));
  };

  /** Cancel-then-reschedule: never leave a stale set of daily notifications around,
   *  whether the times changed, were removed entirely, or the habit itself is deleted. */
  const cancelExistingReminders = async () => {
    if (!habit?.reminderNotificationIds) return;
    await Promise.all(habit.reminderNotificationIds.map((id) => notificationService.cancel(id)));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }

    setIsSaving(true);
    try {
      await cancelExistingReminders();

      const reminderNotificationIds: string[] = [];
      for (const time of reminderTimes) {
        const [hour, minute] = time.split(':').map(Number);
        const identifier = `habitrem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const scheduled = await notificationService.scheduleDaily(
          identifier,
          'Habit reminder',
          `Time for: ${name.trim()}`,
          hour || 0,
          minute || 0
        );
        if (scheduled) reminderNotificationIds.push(scheduled);
      }

      if (habit) {
        habitRepository.update(habit.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
          color,
          targetDaysPerWeek,
          reminderTimes: reminderTimes.length ? reminderTimes : undefined,
          reminderNotificationIds: reminderNotificationIds.length ? reminderNotificationIds : undefined,
        });
      } else {
        habitRepository.create({
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
          color,
          targetDaysPerWeek,
          reminderTimes: reminderTimes.length ? reminderTimes : undefined,
          reminderNotificationIds: reminderNotificationIds.length ? reminderNotificationIds : undefined,
        });
      }

      audioService.playSuccessTone();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save habit');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (habit) {
      cancelExistingReminders();
      habitRepository.delete(habit.id);
      audioService.triggerHaptic('light');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={habit ? 'Edit Habit' : 'New Daily Habit'} maxWidth="sm">
      <View className="flex flex-col gap-4">
        <Input label="Habit Name" placeholder="e.g. Read 20 mins, Morning run, Daily meditation" value={name} onChangeText={setName} autoFocus />

        <Input
          label="Notes / Intent (Optional)"
          placeholder="e.g. Drink 300ml right after waking up"
          value={description}
          onChangeText={setDescription}
        />

        <View className="flex flex-col gap-1.5">
          <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">Color & Icon</Text>
          <View className="flex-row items-center gap-2 flex-wrap mb-2">
            {HABIT_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                className="w-6 h-6 rounded-full"
                style={{
                  backgroundColor: c,
                  transform: color === c ? [{ scale: 1.25 }] : undefined,
                  borderWidth: color === c ? 2 : 0,
                  borderColor: '#18161D',
                }}
              />
            ))}
          </View>

          <View className="flex-row flex-wrap gap-1.5 p-1 bg-ink-50 dark:bg-ink-800/50 rounded-xl border border-ink-200 dark:border-ink-700">
            {HABIT_ICONS.map((ic) => (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                className={cn(
                  'p-2 rounded-lg items-center justify-center',
                  icon === ic ? 'bg-ink-900 dark:bg-ink-100' : 'active:bg-ink-200/60 dark:active:bg-ink-700/60'
                )}
                style={{ width: '15%' }}
              >
                <IconHelper name={ic} size={18} color={icon === ic ? (isDark ? '#18161D' : '#fff') : '#8A8680'} />
              </Pressable>
            ))}
          </View>
        </View>

        <View className="flex flex-col gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">
              Reminders {reminderTimes.length > 0 && `(${reminderTimes.length})`}
            </Text>
            {reminderTimes.length < MAX_REMINDERS && (
              <Pressable onPress={handleAddReminder} className="flex-row items-center gap-1 py-1 px-1.5 active:bg-ink-100 dark:active:bg-ink-800 rounded-lg">
                <Plus size={13} color={ink[500]} />
                <Text className="text-xs font-medium text-ink-500">Add time</Text>
              </Pressable>
            )}
          </View>

          {reminderTimes.length === 0 ? (
            <Text className="text-xs text-ink-400">No reminders — you won't be nudged about this habit.</Text>
          ) : (
            <View className="flex flex-col gap-2">
              {reminderTimes.map((time, i) => (
                <View key={i} className="flex-row items-center gap-2">
                  <Bell size={14} color={ink[400]} />
                  <View className="flex-1">
                    <DateField mode="time" value={time} onChange={(v) => handleChangeReminder(i, v)} />
                  </View>
                  <Pressable
                    onPress={() => handleRemoveReminder(i)}
                    className="p-2 rounded-lg active:bg-ink-100 dark:active:bg-ink-800"
                    accessibilityLabel="Remove reminder"
                  >
                    <X size={14} color={ink[500]} />
                  </Pressable>
                </View>
              ))}
              <Text className="text-[11px] text-ink-400">
                Fires every day at these times, whether or not you've already checked this habit off — there's no
                way for a local reminder to know that in advance.
              </Text>
            </View>
          )}
        </View>

        {error && <Text className="text-xs text-rose-500 font-semibold">{error}</Text>}

        <View className="flex-row items-center justify-between pt-3 border-t border-ink-100 dark:border-ink-800">
          {habit ? (
            <Pressable onPress={handleDelete} className="p-2 rounded-xl active:bg-rose-50 dark:active:bg-rose-950/40" accessibilityLabel="Delete habit">
              <Trash2 size={16} color="#e11d48" />
            </Pressable>
          ) : (
            <View />
          )}

          <View className="flex-row items-center gap-2">
            <Button variant="ghost" size="sm" onPress={onClose}>
              <Text className={cn('text-sm font-medium', buttonTextColor.ghost)}>Cancel</Text>
            </Button>
            <Button size="sm" variant="primary" onPress={handleSave} disabled={isSaving}>
              <Text className={cn('text-sm font-medium', buttonTextColor.primary)}>
                {isSaving ? 'Saving…' : habit ? 'Update Habit' : 'Create Habit'}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
