import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Habit } from '../../types';
import { habitRepository } from '../../database/repositories/habitRepo';
import { getTodayDateString, getPastDaysList, formatShortDay } from '../../utils/date';
import { IconHelper } from '../ui/IconHelper';
import { PressableScale } from '../ui/PressableScale';
import { listItemEntering, listItemExiting, listItemLayout } from '../ui/listMotion';
import { spring, useReducedMotion } from '../../utils/motion';
import { Flame, Check, Edit2 } from 'lucide-react-native';
import { audioService } from '../../services/audioService';
import { cn } from '../../utils/cn';
import { ink } from '../../utils/theme';

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  index?: number;
}

const popIn = ZoomIn.springify().damping(spring.pop.damping).stiffness(spring.pop.stiffness);

export const HabitCard: React.FC<HabitCardProps> = React.memo(({ habit, onEdit, index = 0 }) => {
  const isDark = useColorScheme() === 'dark';
  const reduced = useReducedMotion();
  const todayStr = getTodayDateString();
  const stats = habitRepository.getStats(habit.id);
  const isCompletedToday = habitRepository.isCompletedToday(habit.id, todayStr);

  const past7Days = getPastDaysList(7);

  const handleToggleToday = () => {
    const isNowDone = habitRepository.toggleToday(habit.id, todayStr);
    if (isNowDone) {
      audioService.playSuccessTone();
      audioService.triggerHaptic('success');
    } else {
      audioService.triggerHaptic('light');
    }
  };

  const handleToggleSpecificDay = (dateStr: string) => {
    habitRepository.toggleToday(habit.id, dateStr);
    audioService.triggerHaptic('light');
  };

  return (
    <Animated.View
      entering={reduced ? undefined : listItemEntering(index)}
      exiting={reduced ? undefined : listItemExiting}
      layout={reduced ? undefined : listItemLayout}
    >
    <View className="p-4 rounded-lg bg-surface dark:bg-surface-dark border border-ink-200 dark:border-ink-800 flex flex-col gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 min-w-0 flex-1">
          <View
            className="w-9 h-9 rounded-md items-center justify-center shrink-0"
            style={{ backgroundColor: habit.color }}
          >
            <IconHelper name={habit.icon} size={18} color="#fff" />
          </View>

          <View className="flex flex-col min-w-0 flex-1">
            <Text numberOfLines={1} className="text-xs font-bold text-ink-900 dark:text-ink-100">
              {habit.name}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Flame size={14} color="#f59e0b" fill="#f59e0b" />
              <Text className="text-[11px] font-semibold text-ink-900 dark:text-ink-200">
                {stats.currentStreak} day streak
              </Text>
              <Text className="text-[11px] text-ink-400">• Best: {stats.bestStreak}d</Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => onEdit(habit)}
            className="p-1.5 rounded-md active:bg-ink-100 dark:active:bg-ink-800"
            accessibilityLabel="Edit habit"
          >
            <Edit2 size={14} color={ink[400]} />
          </Pressable>

          <PressableScale
            onPress={handleToggleToday}
            activeScale={0.9}
            className={cn(
              'w-8 h-8 rounded-md items-center justify-center shrink-0 border',
              isCompletedToday
                ? 'bg-ink-900 dark:bg-ink-100 border-transparent'
                : 'bg-ink-50 dark:bg-ink-800 border-ink-200 dark:border-ink-700'
            )}
            accessibilityLabel={isCompletedToday ? 'Completed today! Tap to undo' : 'Mark done for today'}
          >
            {isCompletedToday ? (
              <Animated.View key="done" entering={reduced ? undefined : popIn}>
                <Check size={16} color={isDark ? ink[900] : '#fff'} strokeWidth={3} />
              </Animated.View>
            ) : (
              <Check size={16} color={ink[400]} strokeWidth={3} />
            )}
          </PressableScale>
        </View>
      </View>

      <View className="flex-row items-center justify-between pt-2.5 border-t border-ink-100 dark:border-ink-800">
        {past7Days.map((dateStr) => {
          const isDone = stats.loggedDates.has(dateStr);
          const isCurrentDay = dateStr === todayStr;
          return (
            <Pressable
              key={dateStr}
              onPress={() => handleToggleSpecificDay(dateStr)}
              className="flex flex-col items-center gap-1"
              accessibilityLabel={`${dateStr}: ${isDone ? 'Completed' : 'Missed'}`}
            >
              <Text
                className={cn(
                  'text-[10px] font-medium',
                  isCurrentDay ? 'text-ink-900 dark:text-white font-bold' : 'text-ink-500'
                )}
              >
                {formatShortDay(dateStr)}
              </Text>
              <View
                className={cn(
                  'w-6 h-6 rounded-md items-center justify-center border',
                  isDone
                    ? 'bg-ink-900 dark:bg-ink-100 border-transparent'
                    : 'bg-ink-50 dark:bg-ink-800 border-ink-200 dark:border-ink-700'
                )}
              >
                {isDone ? (
                  <Animated.View key="done" entering={reduced ? undefined : popIn}>
                    <Check size={14} color={isDark ? ink[900] : '#fff'} strokeWidth={3} />
                  </Animated.View>
                ) : (
                  <Text className="text-[10px] text-transparent">•</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
    </Animated.View>
  );
});

HabitCard.displayName = 'HabitCard';
