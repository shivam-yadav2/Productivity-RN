import { dbEngine } from '../db';
import { Habit, HabitFrequency, HabitLog } from '../../types';
import { getTodayDateString } from '../../utils/date';

export const habitRepository = {
  getAll(activeOnly = true): Habit[] {
    const db = dbEngine.getTables();
    return Object.values(db.habits)
      .filter((h) => !activeOnly || h.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  getById(id: string): Habit | undefined {
    return dbEngine.getTables().habits[id];
  },

  create(params: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    frequency?: HabitFrequency;
    targetDaysPerWeek?: number;
    reminderTime?: string;
    startDate?: string;
  }): Habit {
    if (!params.name.trim()) {
      throw new Error('Habit name cannot be empty.');
    }

    const id = `habit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const habit: Habit = {
      id,
      name: params.name.trim(),
      description: params.description?.trim(),
      icon: params.icon || 'Sparkles',
      color: params.color || '#10b981',
      frequency: params.frequency || 'DAILY',
      targetDaysPerWeek: params.targetDaysPerWeek || 7,
      reminderTime: params.reminderTime,
      startDate: params.startDate || getTodayDateString(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    dbEngine.runTransaction((db) => {
      db.habits[id] = habit;
    });

    return habit;
  },

  update(id: string, params: Partial<Omit<Habit, 'id' | 'createdAt'>>): Habit {
    const existing = dbEngine.getTables().habits[id];
    if (!existing) {
      throw new Error(`Habit ${id} not found.`);
    }

    const updated: Habit = {
      ...existing,
      ...params,
      updatedAt: new Date().toISOString(),
    };

    dbEngine.runTransaction((db) => {
      db.habits[id] = updated;
    });

    return updated;
  },

  delete(id: string): void {
    dbEngine.runTransaction((db) => {
      delete db.habits[id];
      // Clean associated logs
      Object.keys(db.habitLogs).forEach((logId) => {
        if (db.habitLogs[logId].habitId === id) {
          delete db.habitLogs[logId];
        }
      });
    });
  },

  isCompletedToday(habitId: string, dateStr = getTodayDateString()): boolean {
    const db = dbEngine.getTables();
    return Object.values(db.habitLogs).some(
      (log) => log.habitId === habitId && log.date === dateStr
    );
  },

  toggleToday(habitId: string, dateStr = getTodayDateString()): boolean {
    const db = dbEngine.getTables();
    const existingLog = Object.values(db.habitLogs).find(
      (log) => log.habitId === habitId && log.date === dateStr
    );

    if (existingLog) {
      dbEngine.runTransaction((d) => {
        delete d.habitLogs[existingLog.id];
      });
      return false;
    } else {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newLog: HabitLog = {
        id: logId,
        habitId,
        date: dateStr,
        completedAt: new Date().toISOString(),
      };
      dbEngine.runTransaction((d) => {
        d.habitLogs[logId] = newLog;
      });
      return true;
    }
  },

  getStats(habitId: string) {
    const db = dbEngine.getTables();
    const logs = Object.values(db.habitLogs)
      .filter((l) => l.habitId === habitId)
      .sort((a, b) => b.date.localeCompare(a.date));

    const loggedDates = new Set(logs.map((l) => l.date));
    const today = new Date();
    
    // Calculate current streak
    let currentStreak = 0;
    const checkDate = new Date(today);
    
    // Check if completed today, if not check if completed yesterday to maintain active streak
    const todayStr = getTodayDateString();
    let isStreakActive = loggedDates.has(todayStr);

    if (!isStreakActive) {
      checkDate.setDate(checkDate.getDate() - 1);
      const yStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (loggedDates.has(yStr)) {
        isStreakActive = true;
      }
    }

    if (isStreakActive) {
      const iter = new Date(today);
      if (!loggedDates.has(todayStr)) {
        iter.setDate(iter.getDate() - 1);
      }
      while (true) {
        const iterStr = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, '0')}-${String(iter.getDate()).padStart(2, '0')}`;
        if (loggedDates.has(iterStr)) {
          currentStreak++;
          iter.setDate(iter.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate best streak
    let bestStreak = currentStreak;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    const sortedAscDates = Array.from(loggedDates).sort();
    sortedAscDates.forEach((dStr) => {
      const [y, m, d] = dStr.split('-').map(Number);
      const curDate = new Date(y, m - 1, d);

      if (!lastDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((curDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
      lastDate = curDate;
    });

    return {
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      totalCompletions: logs.length,
      loggedDates,
    };
  },
};
