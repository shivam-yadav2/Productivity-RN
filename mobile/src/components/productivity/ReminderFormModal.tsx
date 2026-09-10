import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Trash2, AlarmClock, Bell } from 'lucide-react-native';
import { Reminder, ReminderRepeat, ReminderStyle, WEEKDAY_LABELS } from '../../types';
import { reminderRepository } from '../../database/repositories/reminderRepo';
import { scheduleReminder, unscheduleReminder } from '../../services/reminderService';
import { audioService } from '../../services/audioService';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { DateField } from '../ui/DateField';
import { getTodayDateString } from '../../utils/date';
import { ink } from '../../utils/theme';
import { cn } from '../../utils/cn';

interface ReminderFormModalProps {
  reminder: Reminder | null;
  isOpen: boolean;
  onClose: () => void;
}

const REPEAT_OPTIONS: { value: ReminderRepeat; label: string }[] = [
  { value: 'ONCE', label: 'Once' },
  { value: 'DAILY', label: 'Every day' },
  { value: 'WEEKDAYS', label: 'Weekdays' },
  { value: 'CUSTOM', label: 'Pick days' },
];

const SNOOZE_OPTIONS = [0, 5, 10, 15];

export const ReminderFormModal: React.FC<ReminderFormModalProps> = ({
  reminder,
  isOpen,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [time, setTime] = useState('07:00');
  const [date, setDate] = useState(getTodayDateString());
  const [repeat, setRepeat] = useState<ReminderRepeat>('ONCE');
  const [days, setDays] = useState<number[]>([]);
  const [style, setStyle] = useState<ReminderStyle>('ALARM');
  const [snoozeMinutes, setSnoozeMinutes] = useState(5);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setNote(reminder.note || '');
      setTime(reminder.time);
      setDate(reminder.date || getTodayDateString());
      setRepeat(reminder.repeat);
      setDays(reminder.days || []);
      setStyle(reminder.style);
      setSnoozeMinutes(reminder.snoozeMinutes);
    } else {
      setTitle('');
      setNote('');
      setTime('07:00');
      setDate(getTodayDateString());
      setRepeat('ONCE');
      setDays([]);
      setStyle('ALARM');
      setSnoozeMinutes(5);
    }
    setError('');
  }, [reminder, isOpen]);

  const toggleDay = (day: number) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Give the reminder a name');
      return;
    }
    if (repeat === 'CUSTOM' && days.length === 0) {
      setError('Pick at least one day');
      return;
    }

    setIsSaving(true);
    try {
      const fields = {
        title: title.trim(),
        note: note.trim() || undefined,
        time,
        date: repeat === 'ONCE' ? date : undefined,
        repeat,
        days: repeat === 'CUSTOM' ? days : undefined,
        style,
        snoozeMinutes,
      };

      const saved = reminder
        ? reminderRepository.update(reminder.id, { ...fields, isEnabled: true })
        : reminderRepository.create(fields);

      await scheduleReminder(saved);
      audioService.playSuccessTone();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Could not save the reminder');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!reminder) return;
    Alert.alert('Delete reminder?', `"${reminder.title}" will stop ringing.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await unscheduleReminder(reminder);
          reminderRepository.delete(reminder.id);
          audioService.triggerHaptic('light');
          onClose();
        },
      },
    ]);
  };

  const Chip: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({
    label,
    selected,
    onPress,
  }) => (
    <Pressable
      onPress={onPress}
      className={cn(
        'px-3 py-2 rounded-xl border',
        selected
          ? 'bg-ink-900 dark:bg-ink-100 border-ink-900 dark:border-ink-100'
          : 'bg-surface dark:bg-surface-dark border-ink-200 dark:border-ink-700'
      )}
    >
      <Text
        className={cn(
          'text-xs font-semibold',
          selected ? 'text-white dark:text-ink-900' : 'text-ink-700 dark:text-ink-300'
        )}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={reminder ? 'Edit Reminder' : 'New Reminder'}
      maxWidth="sm"
    >
      <View className="flex flex-col gap-4">
        <Input
          label="What should it say?"
          placeholder="e.g. Sleep, Take medicine, Call mom"
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        <Input
          label="Note (optional)"
          placeholder="Shown under the title when it rings"
          value={note}
          onChangeText={setNote}
        />

        <DateField mode="time" label="Time" value={time} onChange={setTime} />

        <View className="flex flex-col gap-1.5">
          <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">Repeat</Text>
          <View className="flex-row flex-wrap gap-2">
            {REPEAT_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={repeat === o.value}
                onPress={() => setRepeat(o.value)}
              />
            ))}
          </View>
        </View>

        {repeat === 'ONCE' && (
          <DateField mode="date" label="Date" value={date} onChange={setDate} />
        )}

        {repeat === 'CUSTOM' && (
          <View className="flex flex-col gap-1.5">
            <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">Days</Text>
            <View className="flex-row gap-1.5">
              {WEEKDAY_LABELS.map((label, i) => (
                <Pressable
                  key={i}
                  onPress={() => toggleDay(i)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl items-center border',
                    days.includes(i)
                      ? 'bg-ink-900 dark:bg-ink-100 border-ink-900 dark:border-ink-100'
                      : 'bg-surface dark:bg-surface-dark border-ink-200 dark:border-ink-700'
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-bold',
                      days.includes(i) ? 'text-white dark:text-ink-900' : 'text-ink-600 dark:text-ink-400'
                    )}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View className="flex flex-col gap-1.5">
          <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">How it alerts</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setStyle('ALARM')}
              className={cn(
                'flex-1 flex-row items-center gap-2 p-3 rounded-2xl border',
                style === 'ALARM'
                  ? 'bg-ink-900 dark:bg-ink-100 border-ink-900 dark:border-ink-100'
                  : 'bg-surface dark:bg-surface-dark border-ink-200 dark:border-ink-700'
              )}
            >
              <AlarmClock size={16} color={style === 'ALARM' ? '#F7F5F2' : ink[500]} />
              <View className="flex-1">
                <Text
                  className={cn(
                    'text-xs font-bold',
                    style === 'ALARM' ? 'text-white dark:text-ink-900' : 'text-ink-800 dark:text-ink-200'
                  )}
                >
                  Alarm
                </Text>
                <Text
                  className={cn(
                    'text-[10px]',
                    style === 'ALARM' ? 'text-white/70 dark:text-ink-900/70' : 'text-ink-500'
                  )}
                >
                  Rings loudly
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setStyle('NOTIFICATION')}
              className={cn(
                'flex-1 flex-row items-center gap-2 p-3 rounded-2xl border',
                style === 'NOTIFICATION'
                  ? 'bg-ink-900 dark:bg-ink-100 border-ink-900 dark:border-ink-100'
                  : 'bg-surface dark:bg-surface-dark border-ink-200 dark:border-ink-700'
              )}
            >
              <Bell size={16} color={style === 'NOTIFICATION' ? '#F7F5F2' : ink[500]} />
              <View className="flex-1">
                <Text
                  className={cn(
                    'text-xs font-bold',
                    style === 'NOTIFICATION'
                      ? 'text-white dark:text-ink-900'
                      : 'text-ink-800 dark:text-ink-200'
                  )}
                >
                  Notify
                </Text>
                <Text
                  className={cn(
                    'text-[10px]',
                    style === 'NOTIFICATION' ? 'text-white/70 dark:text-ink-900/70' : 'text-ink-500'
                  )}
                >
                  Quiet nudge
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {style === 'ALARM' && (
          <View className="flex flex-col gap-1.5">
            <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">Snooze</Text>
            <View className="flex-row gap-2">
              {SNOOZE_OPTIONS.map((m) => (
                <Chip
                  key={m}
                  label={m === 0 ? 'Off' : `${m} min`}
                  selected={snoozeMinutes === m}
                  onPress={() => setSnoozeMinutes(m)}
                />
              ))}
            </View>
          </View>
        )}

        {error ? <Text className="text-xs text-rose-500 font-semibold">{error}</Text> : null}

        <View className="flex-row items-center justify-between pt-3 border-t border-ink-100 dark:border-ink-800">
          {reminder ? (
            <Pressable
              onPress={handleDelete}
              className="p-2 rounded-xl active:bg-rose-50 dark:active:bg-rose-950/40"
              accessibilityLabel="Delete reminder"
            >
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
                {isSaving ? 'Saving…' : reminder ? 'Update' : 'Create'}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
