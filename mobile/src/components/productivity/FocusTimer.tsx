import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, useColorScheme, AppState } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Task, FocusMode } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { focusRepository } from '../../database/repositories/focusRepo';
import { getTodayDateString, getCurrentTimeString } from '../../utils/date';
import { audioService } from '../../services/audioService';
import { notificationService, setFocusSessionActive, FOCUS_END_CATEGORY } from '../../services/notificationService';
import { Select } from '../ui/Select';
import { SegmentedControl } from '../ui/SegmentedControl';
import { AnimatedBar } from '../ui/AnimatedBar';
import { Play, Pause, RotateCcw } from 'lucide-react-native';
import { cn } from '../../utils/cn';
import { ink, inkText } from '../../utils/theme';

const KEEP_AWAKE_TAG = 'focus-timer';

interface FocusTimerProps {
  initialTask?: Task | null;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ initialTask }) => {
  const { db } = useDatabase();
  const isDark = useColorScheme() === 'dark';
  const [mode, setMode] = useState<FocusMode>('FOCUS');
  const [selectedTask, setSelectedTask] = useState<Task | null>(initialTask || null);

  const focusDurationMins = db.settings.pomodoroFocusDuration || 25;
  const breakDurationMins = db.settings.pomodoroBreakDuration || 5;
  const longBreakDurationMins = db.settings.pomodoroLongBreakDuration || 15;

  const getTargetDurationSecs = (m: FocusMode) => {
    if (m === 'FOCUS') return focusDurationMins * 60;
    if (m === 'SHORT_BREAK') return breakDurationMins * 60;
    return longBreakDurationMins * 60;
  };

  const [timeLeft, setTimeLeft] = useState(getTargetDurationSecs('FOCUS'));
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string>('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Absolute end time, not a countdown — a plain setInterval decrementing a counter
  // stops firing reliably once the screen locks (the exact "screen goes off, timer
  // stops, reopening just continues from the stale count" bug this replaces). Deriving
  // timeLeft from `Date.now()` vs this timestamp means that even if ticks get skipped or
  // paused while backgrounded, the moment JS runs again it snaps to the CORRECT elapsed
  // time instead of quietly losing the gap.
  const endAtMsRef = useRef<number | null>(null);
  const pendingEndNotificationId = useRef<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setSelectedTask(initialTask);
    }
  }, [initialTask]);

  const clearEndNotification = () => {
    if (pendingEndNotificationId.current) {
      notificationService.cancel(pendingEndNotificationId.current);
      pendingEndNotificationId.current = null;
    }
  };

  const stopRunningState = () => {
    setIsRunning(false);
    deactivateKeepAwake(KEEP_AWAKE_TAG);
    setFocusSessionActive(false);
  };

  const switchMode = (newMode: FocusMode) => {
    stopRunningState();
    clearEndNotification();
    endAtMsRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setMode(newMode);
    setTimeLeft(getTargetDurationSecs(newMode));
  };

  const handleComplete = () => {
    stopRunningState();
    // The JS timer reached zero on its own (app in foreground) — the scheduled backstop
    // notification for this same moment is now redundant, so drop it before it also fires.
    clearEndNotification();
    endAtMsRef.current = null;
    audioService.playTimerBell();
    audioService.triggerHaptic('success');

    const durationMinutes = Math.round(getTargetDurationSecs(mode) / 60);
    focusRepository.create({
      mode,
      durationMinutes,
      completed: true,
      date: getTodayDateString(),
      startTime: sessionStartTime || getCurrentTimeString(),
      endTime: getCurrentTimeString(),
      taskId: mode === 'FOCUS' && selectedTask ? selectedTask.id : undefined,
    });

    if (mode === 'FOCUS') {
      switchMode('SHORT_BREAK');
    } else {
      switchMode('FOCUS');
    }
  };

  const recomputeFromEndTime = () => {
    if (endAtMsRef.current == null) return;
    const remaining = Math.max(0, Math.round((endAtMsRef.current - Date.now()) / 1000));
    setTimeLeft(remaining);
    if (remaining <= 0) handleComplete();
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(recomputeFromEndTime, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, mode, selectedTask]);

  // Re-sync the instant the app comes back to the foreground, instead of waiting up to a
  // second for the next tick — covers the screen-lock/backgrounding gap directly.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isRunning) recomputeFromEndTime();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Deactivate keep-awake if this screen unmounts mid-session (e.g. navigating away).
  useEffect(() => {
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
      setFocusSessionActive(false);
    };
  }, []);

  const handleStart = () => {
    if (!isRunning) {
      setSessionStartTime(getCurrentTimeString());
      endAtMsRef.current = Date.now() + timeLeft * 1000;
      setIsRunning(true);
      activateKeepAwakeAsync(KEEP_AWAKE_TAG);
      setFocusSessionActive(true);
      audioService.playSoftClick();
      audioService.triggerHaptic('medium');

      // Backstop: if the screen still ends up locking anyway (keep-awake can be
      // overridden by the phone's own power button) and the JS timer gets suspended,
      // this still notifies you the moment the session was due to end.
      const label = mode === 'FOCUS' ? 'Focus session' : mode === 'SHORT_BREAK' ? 'Short break' : 'Long break';
      const identifier = `focusend_${Date.now()}`;
      const endDate = new Date(endAtMsRef.current);
      notificationService
        .scheduleAt(identifier, `${label} complete`, "Time's up — nice work.", endDate, {
          category: FOCUS_END_CATEGORY,
        })
        .then((id) => {
          pendingEndNotificationId.current = id;
        });
    }
  };

  const handlePause = () => {
    stopRunningState();
    clearEndNotification();
    endAtMsRef.current = null;
    audioService.playSoftClick();
    audioService.triggerHaptic('light');
  };

  const handleReset = () => {
    stopRunningState();
    clearEndNotification();
    endAtMsRef.current = null;
    setTimeLeft(getTargetDurationSecs(mode));
    audioService.triggerHaptic('light');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSecs = getTargetDurationSecs(mode);
  const progressPercent = ((totalSecs - timeLeft) / totalSecs) * 100;

  const incompleteTasks = Object.values(db.tasks).filter((t) => t.status !== 'COMPLETED');
  const taskOptions = [
    { label: '(No linked task - General Deep Work)', value: '' },
    ...incompleteTasks.map((t) => ({ label: t.title, value: t.id })),
  ];

  const modeTabs: { key: FocusMode; label: string }[] = [
    { key: 'FOCUS', label: 'Focus' },
    { key: 'SHORT_BREAK', label: 'Short Break' },
    { key: 'LONG_BREAK', label: 'Long Break' },
  ];

  const activeTint = isDark ? ink[900] : '#fff';
  const mutedTint = ink[500];

  return (
    <View className="p-6 bg-surface dark:bg-surface-dark border border-ink-200 dark:border-ink-800 rounded-lg items-center">
      <View className="w-full flex-row justify-between items-center mb-6">
        <Text className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-400 font-bold">
          Focus Timer
        </Text>
        <Text className="text-[10px] uppercase font-semibold bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900 px-2 py-0.5 rounded">
          {mode === 'FOCUS' ? 'FOCUS MODE' : mode === 'SHORT_BREAK' ? 'SHORT BREAK' : 'LONG BREAK'}
        </Text>
      </View>

      <View className="w-full mb-6">
        <SegmentedControl
          segments={modeTabs}
          value={mode}
          onChange={(m) => switchMode(m)}
          size="sm"
        />
      </View>

      <View className="flex flex-col items-center w-full py-2">
        <Text className="text-6xl font-light tracking-tighter text-ink-900 dark:text-ink-100 mb-2 font-mono">
          {formattedTime}
        </Text>
        <Text numberOfLines={1} className="text-xs text-ink-500 mb-6 font-medium">
          {selectedTask ? selectedTask.title : 'Deep work & mindfulness session'}
        </Text>

        <View className="w-full mb-6">
          <AnimatedBar
            percent={progressPercent}
            durationMs={isRunning ? 1000 : 300}
            trackClassName="bg-ink-100 dark:bg-ink-800 h-1.5 rounded-full"
            fillColor={inkText(isDark)}
          />
        </View>

        {mode === 'FOCUS' && (
          <View className="w-full flex flex-col gap-1 mb-6">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              Linked Task:
            </Text>
            <Select
              value={selectedTask?.id || ''}
              onChange={(v) => setSelectedTask(db.tasks[v] || null)}
              options={taskOptions}
            />
          </View>
        )}

        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={handleReset}
            className="px-4 py-2 border border-ink-200 dark:border-ink-700 rounded-md active:bg-ink-50 dark:active:bg-ink-800"
            accessibilityLabel="Reset timer"
          >
            <RotateCcw size={14} color={mutedTint} />
          </Pressable>

          {isRunning ? (
            <Pressable
              onPress={handlePause}
              className="px-6 py-2 border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 rounded-md flex-row items-center gap-1.5"
            >
              <Pause size={14} color={inkText(isDark)} />
              <Text className="text-xs font-semibold text-ink-900 dark:text-ink-100">Pause</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleStart}
              className="px-6 py-2 bg-ink-900 dark:bg-ink-100 rounded-md flex-row items-center gap-1.5"
            >
              <Play size={14} color={activeTint} fill={activeTint} />
              <Text className="text-xs font-semibold" style={{ color: activeTint }}>
                Start
              </Text>
            </Pressable>
          )}

          {isRunning && (
            <Pressable onPress={handleReset} className="px-6 py-2 bg-ink-900 dark:bg-ink-100 rounded-md">
              <Text className="text-xs font-semibold" style={{ color: activeTint }}>
                Stop
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};
