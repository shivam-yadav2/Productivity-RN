import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { Task, FocusMode } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { focusRepository } from '../../database/repositories/focusRepo';
import { getTodayDateString, getCurrentTimeString } from '../../utils/date';
import { audioService } from '../../services/audioService';
import { Select } from '../ui/Select';
import { Play, Pause, RotateCcw } from 'lucide-react-native';
import { cn } from '../../utils/cn';

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

  useEffect(() => {
    if (initialTask) {
      setSelectedTask(initialTask);
    }
  }, [initialTask]);

  const switchMode = (newMode: FocusMode) => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setMode(newMode);
    setTimeLeft(getTargetDurationSecs(newMode));
  };

  const handleComplete = () => {
    setIsRunning(false);
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

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, mode, selectedTask]);

  const handleStart = () => {
    if (!isRunning) {
      setSessionStartTime(getCurrentTimeString());
      setIsRunning(true);
      audioService.playSoftClick();
      audioService.triggerHaptic('medium');
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    audioService.playSoftClick();
    audioService.triggerHaptic('light');
  };

  const handleReset = () => {
    setIsRunning(false);
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

  const activeTint = isDark ? '#1A1A1A' : '#fff';
  const mutedTint = '#71716E';

  return (
    <View className="p-6 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg items-center">
      <View className="w-full flex-row justify-between items-center mb-6">
        <Text className="text-xs uppercase tracking-wider text-[#71716E] dark:text-[#999996] font-bold">
          Focus Timer
        </Text>
        <Text className="text-[10px] uppercase font-semibold bg-[#1A1A1A] text-white dark:bg-[#F0F0EE] dark:text-[#1A1A1A] px-2 py-0.5 rounded">
          {mode === 'FOCUS' ? 'FOCUS MODE' : mode === 'SHORT_BREAK' ? 'SHORT BREAK' : 'LONG BREAK'}
        </Text>
      </View>

      <View className="flex-row items-center gap-1 p-1 bg-[#F0F0EE] dark:bg-[#252523] rounded-md mb-6 border border-[#E5E5E2] dark:border-[#333330]">
        {modeTabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => switchMode(tab.key)}
            className={cn(
              'px-3 py-1 rounded',
              mode === tab.key && 'bg-white dark:bg-[#1A1A19]'
            )}
          >
            <Text
              className={cn(
                'text-xs font-semibold',
                mode === tab.key ? 'text-[#1A1A1A] dark:text-white' : 'text-[#71716E]'
              )}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex flex-col items-center w-full py-2">
        <Text className="text-6xl font-light tracking-tighter text-[#1A1A1A] dark:text-[#F3F3F1] mb-2 font-mono">
          {formattedTime}
        </Text>
        <Text numberOfLines={1} className="text-xs text-[#71716E] mb-6 font-medium">
          {selectedTask ? selectedTask.title : 'Deep work & mindfulness session'}
        </Text>

        <View className="w-full bg-[#F0F0EE] dark:bg-[#252523] h-1.5 rounded-full overflow-hidden mb-6">
          <View
            className="bg-[#1A1A1A] dark:bg-[#EDEDEB] h-full rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </View>

        {mode === 'FOCUS' && (
          <View className="w-full flex flex-col gap-1 mb-6">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-[#71716E]">
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
            className="px-4 py-2 border border-[#E5E5E2] dark:border-[#333330] rounded-md active:bg-[#F9F9F8] dark:active:bg-[#252523]"
            accessibilityLabel="Reset timer"
          >
            <RotateCcw size={14} color={mutedTint} />
          </Pressable>

          {isRunning ? (
            <Pressable
              onPress={handlePause}
              className="px-6 py-2 border border-[#E5E5E2] dark:border-[#333330] bg-white dark:bg-[#252523] rounded-md flex-row items-center gap-1.5"
            >
              <Pause size={14} color={isDark ? '#EDEDEB' : '#1A1A1A'} />
              <Text className="text-xs font-semibold text-[#1A1A1A] dark:text-[#EDEDEB]">Pause</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleStart}
              className="px-6 py-2 bg-[#1A1A1A] dark:bg-[#EDEDEB] rounded-md flex-row items-center gap-1.5"
            >
              <Play size={14} color={activeTint} fill={activeTint} />
              <Text className="text-xs font-semibold" style={{ color: activeTint }}>
                Start
              </Text>
            </Pressable>
          )}

          {isRunning && (
            <Pressable onPress={handleReset} className="px-6 py-2 bg-[#1A1A1A] dark:bg-[#EDEDEB] rounded-md">
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
