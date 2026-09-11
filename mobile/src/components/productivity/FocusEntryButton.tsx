import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Timer } from 'lucide-react-native';
import { PressableScale } from '../ui/PressableScale';
import {
  focusSecondsRemaining,
  getActiveFocusSession,
  subscribeToFocusSession,
} from './focusSession';
import { cn } from '../../utils/cn';
import { ink, accent } from '../../utils/theme';

interface FocusEntryButtonProps {
  onPress: () => void;
  isDark: boolean;
}

function formatRemaining(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Opens Focus, and is the only thing on screen that shows a session is still running once
 * the focus screen is closed. Without it a running timer would be invisible.
 *
 * Ticks once a second, but only while a session is actually active — an idle button sets
 * up no interval at all.
 */
export const FocusEntryButton: React.FC<FocusEntryButtonProps> = ({ onPress, isDark }) => {
  const [remaining, setRemaining] = useState(() => focusSecondsRemaining());

  useEffect(() => {
    const sync = () => setRemaining(focusSecondsRemaining());
    const unsubscribe = subscribeToFocusSession(sync);
    sync();

    let interval: ReturnType<typeof setInterval> | null = null;
    if (getActiveFocusSession()) {
      interval = setInterval(sync, 1000);
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
    // Re-evaluates whenever a session starts or stops, so the interval is created and
    // torn down along with it.
  }, [remaining > 0]);

  const isRunning = remaining > 0;

  return (
    <PressableScale
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1.5 px-3 py-2 rounded-xl border',
        isRunning
          ? 'border-transparent'
          : 'bg-ink-100 dark:bg-ink-800 border-transparent'
      )}
      style={
        isRunning
          ? { backgroundColor: isDark ? accent.purple.deep : accent.purple.bg }
          : undefined
      }
    >
      <Timer
        size={14}
        color={isRunning ? (isDark ? '#FFFFFF' : accent.purple.deep) : ink[500]}
      />
      <Text
        className="text-xs font-bold"
        style={{
          color: isRunning ? (isDark ? '#FFFFFF' : accent.purple.deep) : ink[600],
        }}
      >
        {isRunning ? formatRemaining(remaining) : 'Focus'}
      </Text>
      {isRunning && (
        <View
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: isDark ? '#FFFFFF' : accent.purple.base }}
        />
      )}
    </PressableScale>
  );
};
