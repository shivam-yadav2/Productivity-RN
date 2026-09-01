import React from 'react';
import { View, Text } from 'react-native';
import { useDatabase } from '../../context/DatabaseContext';
import { getTodayDateString, getPastDaysList, formatShortDay } from '../../utils/date';

export const FocusAnalytics: React.FC = () => {
  const { db } = useDatabase();
  const sessions = Object.values(db.focusSessions);
  const todayStr = getTodayDateString();

  const getSessionMins = (s: any) =>
    s.durationMinutes !== undefined ? s.durationMinutes : Math.round((s.durationSeconds || 0) / 60);

  const isFocusSession = (s: any) => s.sessionType === 'FOCUS' || s.mode === 'FOCUS' || !s.sessionType;

  const todaySessions = sessions.filter((s) => s.date === todayStr && s.completed);
  const todayFocusMinutes = todaySessions.filter(isFocusSession).reduce((sum, s) => sum + getSessionMins(s), 0);

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
    <View className="flex flex-col gap-3">
      <View className="flex-row gap-3">
        <View className="flex-1 p-4 bg-surface dark:bg-surface-dark border border-ink-200 dark:border-ink-800 rounded-lg flex flex-col gap-1">
          <Text className="text-[10px] uppercase tracking-wider font-bold text-ink-500 dark:text-ink-400">
            Today's Focus
          </Text>
          <Text className="text-2xl font-light tracking-tight text-ink-900 dark:text-ink-100">
            {todayFocusMinutes} <Text className="text-xs font-normal text-ink-500">mins</Text>
          </Text>
        </View>

        <View className="flex-1 p-4 bg-surface dark:bg-surface-dark border border-ink-200 dark:border-ink-800 rounded-lg flex flex-col gap-1">
          <Text className="text-[10px] uppercase tracking-wider font-bold text-ink-500 dark:text-ink-400">
            Total Completed
          </Text>
          <Text className="text-2xl font-light tracking-tight text-ink-900 dark:text-ink-100">
            {totalCompletedSessions} <Text className="text-xs font-normal text-ink-500">sessions</Text>
          </Text>
        </View>
      </View>

      <View className="p-5 bg-surface dark:bg-surface-dark border border-ink-200 dark:border-ink-800 rounded-lg flex flex-col gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
            7-Day Focus Trend
          </Text>
          <Text className="text-[11px] font-medium text-ink-500">{totalFocusMinutes}m Total</Text>
        </View>

        <View className="flex-row items-end justify-between gap-2 h-24 pt-4">
          {past7Days.map((d) => {
            const mins = dailyFocusMap[d] || 0;
            const heightPercent = Math.max(6, Math.round((mins / maxDailyMin) * 100));
            const isToday = d === todayStr;

            return (
              <View key={d} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <Text className="text-[10px] font-mono text-ink-500">{mins > 0 ? `${mins}m` : ''}</Text>
                <View className="w-full max-w-[18px] bg-ink-100 dark:bg-ink-800 rounded-t-sm overflow-hidden h-full justify-end">
                  <View
                    className={isToday ? 'w-full rounded-t-sm bg-ink-900 dark:bg-ink-100' : 'w-full rounded-t-sm bg-ink-500 dark:bg-ink-700'}
                    style={{ height: `${heightPercent}%` }}
                  />
                </View>
                <Text
                  className={
                    isToday
                      ? 'text-[10px] font-bold tracking-wider text-ink-900 dark:text-ink-100'
                      : 'text-[10px] font-semibold tracking-wider text-ink-500'
                  }
                >
                  {formatShortDay(d)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};
