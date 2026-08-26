import React, { useState, useEffect, useRef } from 'react';
import { Task, FocusMode } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { focusRepository } from '../../database/repositories/focusRepo';
import { getTodayDateString, getCurrentTimeString } from '../../utils/date';
import { audioService } from '../../services/audioService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Play, Pause, RotateCcw, Check, Sparkles, Coffee } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FocusTimerProps {
  initialTask?: Task | null;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ initialTask }) => {
  const { db } = useDatabase();
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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

  const handleComplete = () => {
    setIsRunning(false);
    audioService.playTimerBell();
    audioService.triggerHaptic('success');

    // Record session
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

    // Suggest next mode
    if (mode === 'FOCUS') {
      switchMode('SHORT_BREAK');
    } else {
      switchMode('FOCUS');
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSecs = getTargetDurationSecs(mode);
  const progressPercent = ((totalSecs - timeLeft) / totalSecs) * 100;

  const incompleteTasks = Object.values(db.tasks).filter((t) => t.status !== 'COMPLETED');

  return (
    <div className="p-6 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg shadow-xs flex flex-col items-center">
      {/* Header with Mode Sub-badge */}
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-xs uppercase tracking-wider text-[#71716E] dark:text-[#999996] font-bold">
          Focus Timer
        </h2>
        <span className="text-[10px] uppercase font-semibold bg-[#1A1A1A] text-white dark:bg-[#F0F0EE] dark:text-[#1A1A1A] px-2 py-0.5 rounded">
          {mode === 'FOCUS' ? 'FOCUS MODE' : mode === 'SHORT_BREAK' ? 'SHORT BREAK' : 'LONG BREAK'}
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#F0F0EE] dark:bg-[#252523] rounded-md mb-6 border border-[#E5E5E2] dark:border-[#333330]">
        <button
          onClick={() => switchMode('FOCUS')}
          className={cn(
            'px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer',
            mode === 'FOCUS'
              ? 'bg-white dark:bg-[#1A1A19] text-[#1A1A1A] dark:text-white shadow-2xs'
              : 'text-[#71716E] hover:text-[#1A1A1A] dark:hover:text-[#EDEDEB]'
          )}
        >
          Focus
        </button>
        <button
          onClick={() => switchMode('SHORT_BREAK')}
          className={cn(
            'px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer',
            mode === 'SHORT_BREAK'
              ? 'bg-white dark:bg-[#1A1A19] text-[#1A1A1A] dark:text-white shadow-2xs'
              : 'text-[#71716E] hover:text-[#1A1A1A] dark:hover:text-[#EDEDEB]'
          )}
        >
          Short Break
        </button>
        <button
          onClick={() => switchMode('LONG_BREAK')}
          className={cn(
            'px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer',
            mode === 'LONG_BREAK'
              ? 'bg-white dark:bg-[#1A1A19] text-[#1A1A1A] dark:text-white shadow-2xs'
              : 'text-[#71716E] hover:text-[#1A1A1A] dark:hover:text-[#EDEDEB]'
          )}
        >
          Long Break
        </button>
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center w-full py-2">
        <div className="text-6xl font-light tracking-tighter text-[#1A1A1A] dark:text-[#F3F3F1] mb-2 font-mono">
          {formattedTime}
        </div>
        <div className="text-xs text-[#71716E] mb-6 font-medium truncate max-w-xs">
          {selectedTask ? selectedTask.title : 'Deep work & mindfulness session'}
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full bg-[#F0F0EE] dark:bg-[#252523] h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-[#1A1A1A] dark:bg-[#EDEDEB] h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Task Selector if in Focus Mode */}
        {mode === 'FOCUS' && (
          <div className="w-full max-w-sm flex flex-col gap-1 text-left mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71716E]">
              Linked Task:
            </span>
            <select
              value={selectedTask?.id || ''}
              onChange={(e) => {
                const t = db.tasks[e.target.value] || null;
                setSelectedTask(t);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-md bg-[#F9F9F8] dark:bg-[#252523] border border-[#E5E5E2] dark:border-[#333330] text-[#1A1A1A] dark:text-[#EDEDEB] focus:outline-none"
            >
              <option value="">(No linked task - General Deep Work)</option>
              {incompleteTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-[#E5E5E2] dark:border-[#333330] rounded-md text-xs font-semibold hover:bg-[#F9F9F8] dark:hover:bg-[#252523] text-[#71716E] dark:text-[#A8A8A4] transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {isRunning ? (
            <button
              onClick={handlePause}
              className="px-6 py-2 border border-[#E5E5E2] dark:border-[#333330] bg-white dark:bg-[#252523] text-[#1A1A1A] dark:text-[#EDEDEB] rounded-md text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-6 py-2 bg-[#1A1A1A] dark:bg-[#EDEDEB] text-white dark:text-[#1A1A1A] rounded-md text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Start
            </button>
          )}

          {isRunning && (
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-[#1A1A1A] text-white dark:bg-[#EDEDEB] dark:text-[#1A1A1A] rounded-md text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
