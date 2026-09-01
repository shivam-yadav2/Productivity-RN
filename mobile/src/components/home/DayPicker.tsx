import React, { useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { getPastDaysList, getTodayDateString } from '../../utils/date';
import { cn } from '../../utils/cn';

/**
 * Horizontally-scrollable strip of date pills, matching the design reference's day picker.
 * Selecting a pill is a purely visual affordance — the reference mock doesn't drive any
 * content from it either, so Home always keeps showing today's data regardless of selection.
 */
export const DayPicker: React.FC = () => {
  const todayStr = getTodayDateString();
  const [selected, setSelected] = useState(todayStr);
  const days = getPastDaysList(7);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {days.map((dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const label = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
        const isSelected = dateStr === selected;

        return (
          <Pressable
            key={dateStr}
            onPress={() => setSelected(dateStr)}
            className={cn(
              'w-[46px] py-2.5 rounded-[18px] items-center gap-1.5',
              isSelected && 'bg-ink-900 dark:bg-ink-100'
            )}
          >
            <Text
              className={cn(
                'text-[10.5px] font-semibold uppercase opacity-70',
                isSelected ? 'text-ink-50 dark:text-ink-900' : 'text-ink-500'
              )}
            >
              {label}
            </Text>
            <Text
              className={cn(
                'font-jakarta text-[15px]',
                isSelected ? 'text-ink-50 dark:text-ink-900' : 'text-ink-900 dark:text-ink-50'
              )}
            >
              {d}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
