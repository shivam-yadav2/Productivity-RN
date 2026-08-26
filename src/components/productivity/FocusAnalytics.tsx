import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { getTodayDateString, getPastDaysList, formatShortDay } from '../../utils/date';
import { Card } from '../ui/Card';
import { Clock, Zap, CheckCircle, Flame } from 'lucide-react';

export const FocusAnalytics: React.FC = () => {
  const { db } = useDatabase();
  const sessions = Object.values(db.focusSessions);
  const todayStr = getTodayDateString();

  const getSessionMins = (s: any) =>
    s.durationMinutes !== undefined
      ? s.durationMinutes
      : Math.round((s.durationSeconds || 0) / 60);

  const isFocusSession = (s: any) =>
    s.sessionType === 'FOCUS' || s.mode === 'FOCUS' || !s.sessionType;

  const todaySessions = sessions.filter((s) => s.date === todayStr && s.completed);
  const todayFocusMinutes = todaySessions
    .filter(isFocusSession)
    .reduce((sum, s) => sum + getSessionMins(s), 0);

  const totalCompletedSessions = sessions.filter((s) => s.completed).length;
  const totalFocusMinutes = sessions
    .filter((s) => isFocusSession(s) && s.completed)
    .reduce((sum, s) => sum + getSessionMins(s), 0);

  const past7Days = getPastDaysList(7);
  const dailyFocusMap: Record<string, number> = {};

  past7Days.forEach((d) => {
    dailyFocusMap[d] = sessions
      .filter((s) => s.date === d && isFocusSession(s) && s.completed)
      .reduce((sum, s) => sum + getSessionMins(s), 0);
  });

  const maxDailyMin = Math.max(1, ...Object.values(dailyFocusMap));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg shadow-xs flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#71716E] dark:text-[#999996]">
            Today's Focus
          </span>
          <span className="text-2xl font-light tracking-tight text-[#1A1A1A] dark:text-[#F3F3F1]">
            {todayFocusMinutes} <span className="text-xs font-normal text-[#71716E]">mins</span>
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg shadow-xs flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#71716E] dark:text-[#999996]">
            Total Completed
          </span>
          <span className="text-2xl font-light tracking-tight text-[#1A1A1A] dark:text-[#F3F3F1]">
            {totalCompletedSessions} <span className="text-xs font-normal text-[#71716E]">sessions</span>
          </span>
        </div>
      </div>

      {/* 7-Day Focus Bar Chart */}
      <div className="p-5 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
            7-Day Focus Trend
          </span>
          <span className="text-[11px] font-medium text-[#71716E]">
            {totalFocusMinutes}m Total
          </span>
        </div>

        <div className="flex items-end justify-between gap-2 h-24 pt-4">
          {past7Days.map((d) => {
            const mins = dailyFocusMap[d] || 0;
            const heightPercent = Math.round((mins / maxDailyMin) * 100);
            const isToday = d === todayStr;

            return (
              <div key={d} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-mono text-[#71716E]">
                  {mins > 0 ? `${mins}m` : ''}
                </span>
                <div className="w-full max-w-[18px] bg-[#F0F0EE] dark:bg-[#252523] rounded-t-sm overflow-hidden h-full flex items-end">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isToday
                        ? 'bg-[#1A1A1A] dark:bg-[#EDEDEB]'
                        : 'bg-[#71716E] dark:bg-[#4A4A47]'
                    }`}
                    style={{ height: `${Math.max(6, heightPercent)}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-wider ${
                    isToday
                      ? 'text-[#1A1A1A] dark:text-[#F3F3F1] font-bold'
                      : 'text-[#71716E]'
                  }`}
                >
                  {formatShortDay(d)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
