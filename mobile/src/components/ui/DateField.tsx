import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import { cn } from '../../utils/cn';

interface DateFieldProps {
  /** 'date' values are 'YYYY-MM-DD', 'time' values are 'HH:MM', matching src/utils/date.ts's string format. */
  mode: 'date' | 'time';
  value: string | undefined;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

function toDate(mode: 'date' | 'time', value: string | undefined): Date {
  if (!value) return new Date();
  if (mode === 'date') {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }
  const [h, min] = value.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, min || 0, 0, 0);
  return d;
}

function fromDate(mode: 'date' | 'time', date: Date): string {
  if (mode === 'date') {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

function formatDisplay(mode: 'date' | 'time', value: string | undefined): string {
  if (!value) return mode === 'date' ? 'Select date' : 'Select time';
  if (mode === 'time') {
    const [h, m] = value.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 || 12;
    return `${displayHours}:${String(m).padStart(2, '0')} ${period}`;
  }
  return value;
}

/** RN has no native date/time <input>; this wraps @react-native-community/datetimepicker behind the same string format used throughout the app. */
export const DateField: React.FC<DateFieldProps> = ({ mode, value, onChange, label, className }) => {
  const [show, setShow] = useState(false);
  const Icon = mode === 'date' ? Calendar : Clock;

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) onChange(fromDate(mode, selectedDate));
  };

  return (
    <View className="w-full flex flex-col gap-1.5">
      {label && <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">{label}</Text>}

      <Pressable
        onPress={() => setShow(true)}
        className={cn(
          'w-full flex-row items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-ink-900 border border-ink-300 dark:border-ink-700/80',
          className
        )}
      >
        <Icon size={16} color="#A79D8C" />
        <Text className={cn('text-sm', value ? 'text-ink-900 dark:text-ink-100' : 'text-ink-400 dark:text-ink-500')}>
          {formatDisplay(mode, value)}
        </Text>
      </Pressable>

      {show && (
        <DateTimePicker
          value={toDate(mode, value)}
          mode={mode}
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  );
};
