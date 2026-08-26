import React from 'react';
import { Habit } from '../../types';
import { habitRepository } from '../../database/repositories/habitRepo';
import { getTodayDateString, getPastDaysList, formatShortDay } from '../../utils/date';
import { IconHelper } from '../ui/IconHelper';
import { Flame, Check, Edit2 } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { cn } from '../../utils/cn';

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onEdit }) => {
  const todayStr = getTodayDateString();
  const stats = habitRepository.getStats(habit.id);
  const isCompletedToday = habitRepository.isCompletedToday(habit.id, todayStr);

  // Last 7 days
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
    <div
      className="p-4 rounded-lg bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] shadow-xs flex flex-col gap-3"
      id={`habit_${habit.id}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: habit.color }}
          >
            <IconHelper name={habit.icon} size={18} />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#1A1A1A] dark:text-[#F3F3F1] truncate">
              {habit.name}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#71716E]">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="font-semibold text-[#1A1A1A] dark:text-[#D4D4D0]">
                {stats.currentStreak} day streak
              </span>
              <span className="text-[#999996]">• Best: {stats.bestStreak}d</span>
            </div>
          </div>
        </div>

        {/* 1-Tap Today Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(habit)}
            className="p-1.5 text-[#999996] hover:text-[#1A1A1A] dark:hover:text-white rounded-md transition-colors"
            title="Edit habit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToggleToday}
            className={cn(
              'w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border',
              isCompletedToday
                ? 'bg-[#1A1A1A] text-white dark:bg-[#EDEDEB] dark:text-[#1A1A1A] border-transparent shadow-xs'
                : 'bg-[#F9F9F8] dark:bg-[#252523] text-[#999996] border-[#E5E5E2] dark:border-[#333330] hover:bg-[#F0F0EE]'
            )}
            title={isCompletedToday ? 'Completed today! Tap to undo' : 'Mark done for today'}
          >
            <Check className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* 7-Day Mini Heatmap Strip */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#F0F0EE] dark:border-[#2C2C29]">
        {past7Days.map((dateStr) => {
          const isDone = stats.loggedDates.has(dateStr);
          const isCurrentDay = dateStr === todayStr;
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleToggleSpecificDay(dateStr)}
              className="flex flex-col items-center gap-1 group cursor-pointer"
              title={`${dateStr}: ${isDone ? 'Completed' : 'Missed'}`}
            >
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  isCurrentDay
                    ? 'text-[#1A1A1A] dark:text-white font-bold'
                    : 'text-[#71716E]'
                )}
              >
                {formatShortDay(dateStr)}
              </span>
              <div
                className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center text-[10px] transition-all border',
                  isDone
                    ? 'bg-[#1A1A1A] text-white dark:bg-[#EDEDEB] dark:text-[#1A1A1A] border-transparent font-bold'
                    : 'bg-[#F9F9F8] dark:bg-[#252523] text-transparent border-[#E5E5E2] dark:border-[#333330] group-hover:border-[#999996]'
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '•'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
