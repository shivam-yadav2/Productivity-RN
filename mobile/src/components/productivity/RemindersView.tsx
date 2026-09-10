import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, useColorScheme } from 'react-native';
import Animated from 'react-native-reanimated';
import { AlarmClock, BellOff, Plus, Timer, Trash2, TriangleAlert } from 'lucide-react-native';
import { Reminder, COUNTDOWN_PRESETS } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { reminderRepository } from '../../database/repositories/reminderRepo';
import {
  scheduleReminder,
  unscheduleReminder,
  describeSchedule,
  alarmPermissions,
} from '../../services/reminderService';
import { audioService } from '../../services/audioService';
import { PressableScale } from '../ui/PressableScale';
import { listItemEntering, listItemExiting, listItemLayout } from '../ui/listMotion';
import { useReducedMotion } from '../../utils/motion';
import { ink, accent } from '../../utils/theme';
import { cn } from '../../utils/cn';

interface RemindersViewProps {
  onOpenNewReminder: () => void;
  onSelectReminder: (reminder: Reminder) => void;
}

/** Turns "in 45 minutes" into the HH:mm + date a one-off reminder needs. */
function countdownFields(minutes: number) {
  const when = new Date(Date.now() + minutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    time: `${pad(when.getHours())}:${pad(when.getMinutes())}`,
    date: `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`,
    label: when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  onOpenNewReminder,
  onSelectReminder,
}) => {
  const { db } = useDatabase();
  const isDark = useColorScheme() === 'dark';
  const reduced = useReducedMotion();
  const [busy, setBusy] = useState(false);

  const reminders = useMemo(
    () => reminderRepository.getAll(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.reminders]
  );

  // Android 12+ can refuse exact alarms until the user grants "Alarms & reminders";
  // without it a ring can drift by minutes, which is worth saying out loud rather than
  // letting them discover it by oversleeping.
  const needsExactPermission = alarmPermissions.isSupported && !alarmPermissions.canScheduleExact();

  const startCountdown = async (minutes: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const { time, date, label } = countdownFields(minutes);
      const created = reminderRepository.create({
        title: minutes >= 60 ? `${minutes / 60}h timer` : `${minutes}m timer`,
        note: `Set at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
        time,
        date,
        repeat: 'ONCE',
        style: 'ALARM',
        snoozeMinutes: 5,
        isCountdown: true,
      });
      await scheduleReminder(created);
      audioService.playSuccessTone();
      audioService.triggerHaptic('success');
      Alert.alert('Timer set', `You'll be woken at ${label}.`);
    } catch (e: any) {
      Alert.alert('Could not set timer', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async (reminder: Reminder) => {
    const updated = reminderRepository.update(reminder.id, { isEnabled: !reminder.isEnabled });
    audioService.triggerHaptic('light');
    await scheduleReminder(updated);
  };

  const handleDelete = (reminder: Reminder) => {
    Alert.alert('Delete reminder?', `"${reminder.title}" will stop ringing.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await unscheduleReminder(reminder);
          reminderRepository.delete(reminder.id);
          audioService.triggerHaptic('light');
        },
      },
    ]);
  };

  return (
    <View className="flex flex-col gap-4">
      {needsExactPermission && (
        <Pressable
          onPress={() => alarmPermissions.openSettings()}
          className="flex-row items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 active:opacity-80"
        >
          <TriangleAlert size={16} color="#d97706" />
          <View className="flex-1">
            <Text className="text-xs font-bold text-amber-800 dark:text-amber-200">
              Allow exact alarms
            </Text>
            <Text className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
              Android is currently allowed to delay these by several minutes. Tap to grant
              "Alarms & reminders" so they ring on time.
            </Text>
          </View>
        </Pressable>
      )}

      {/* Quick countdown / sleep timer */}
      <View className="flex flex-col gap-2">
        <View className="flex-row items-center gap-1.5">
          <Timer size={14} color={ink[500]} />
          <Text className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
            Remind me in
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {COUNTDOWN_PRESETS.map((m) => (
            <PressableScale
              key={m}
              onPress={() => startCountdown(m)}
              className="px-3.5 py-2 rounded-xl bg-ink-100 dark:bg-ink-800 active:bg-ink-200 dark:active:bg-ink-700"
            >
              <Text className="text-xs font-bold text-ink-800 dark:text-ink-200">
                {m >= 60 ? `${m / 60}h` : `${m}m`}
              </Text>
            </PressableScale>
          ))}
        </View>
      </View>

      {/* Saved reminders */}
      <View className="flex flex-col gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
            Reminders ({reminders.length})
          </Text>
          <Pressable
            onPress={onOpenNewReminder}
            className="flex-row items-center gap-1 px-2 py-1 rounded-lg active:bg-ink-100 dark:active:bg-ink-800"
          >
            <Plus size={13} color={ink[500]} />
            <Text className="text-xs font-semibold text-ink-500">New</Text>
          </Pressable>
        </View>

        {reminders.length === 0 ? (
          <View className="py-10 px-5 items-center bg-ink-50 dark:bg-ink-800/30 rounded-3xl border border-ink-200/60 dark:border-ink-800">
            <AlarmClock size={26} color={ink[400]} />
            <Text className="text-xs font-semibold text-ink-900 dark:text-ink-100 mt-2.5">
              No reminders yet
            </Text>
            <Text className="text-[11px] text-ink-500 text-center mt-1">
              Use a quick timer above, or create one that repeats.
            </Text>
          </View>
        ) : (
          reminders.map((reminder, index) => (
            <Animated.View
              key={reminder.id}
              entering={reduced || index > 10 ? undefined : listItemEntering(index)}
              exiting={reduced ? undefined : listItemExiting}
              layout={reduced ? undefined : listItemLayout}
            >
              <Pressable
                onPress={() => onSelectReminder(reminder)}
                className={cn(
                  'flex-row items-center gap-3 p-3.5 rounded-3xl border',
                  reminder.isEnabled
                    ? 'bg-surface dark:bg-surface-dark border-ink-200 dark:border-ink-800'
                    : 'bg-ink-50 dark:bg-ink-900/40 border-ink-100 dark:border-ink-800/60'
                )}
              >
                <View
                  className="w-10 h-10 rounded-2xl items-center justify-center"
                  style={{
                    backgroundColor: reminder.isEnabled
                      ? isDark
                        ? accent.purple.deep
                        : accent.purple.bg
                      : isDark
                        ? ink[800]
                        : ink[100],
                  }}
                >
                  {reminder.style === 'ALARM' ? (
                    <AlarmClock
                      size={18}
                      color={
                        reminder.isEnabled ? (isDark ? '#FFFFFF' : accent.purple.deep) : ink[400]
                      }
                    />
                  ) : (
                    <BellOff size={18} color={reminder.isEnabled ? ink[500] : ink[400]} />
                  )}
                </View>

                <View className="flex-1 min-w-0">
                  <Text
                    numberOfLines={1}
                    className={cn(
                      'text-sm font-bold',
                      reminder.isEnabled
                        ? 'text-ink-900 dark:text-ink-100'
                        : 'text-ink-400 dark:text-ink-500'
                    )}
                  >
                    {reminder.title}
                  </Text>
                  <Text className="text-[11px] text-ink-500 mt-0.5" numberOfLines={1}>
                    {describeSchedule(reminder)}
                    {reminder.style === 'NOTIFICATION' ? ' · silent' : ''}
                  </Text>
                </View>

                <Pressable
                  onPress={() => toggleEnabled(reminder)}
                  hitSlop={8}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: reminder.isEnabled }}
                  className="mr-1"
                >
                  <View
                    className={cn(
                      'w-11 h-6 rounded-full p-0.5',
                      reminder.isEnabled
                        ? 'bg-ink-900 dark:bg-ink-100 items-end'
                        : 'bg-ink-200 dark:bg-ink-700 items-start'
                    )}
                  >
                    <View className="w-5 h-5 rounded-full bg-white dark:bg-ink-900" />
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => handleDelete(reminder)}
                  hitSlop={6}
                  className="p-1.5 rounded-lg active:bg-rose-50 dark:active:bg-rose-950/40"
                  accessibilityLabel="Delete reminder"
                >
                  <Trash2 size={15} color={ink[400]} />
                </Pressable>
              </Pressable>
            </Animated.View>
          ))
        )}
      </View>
    </View>
  );
};
