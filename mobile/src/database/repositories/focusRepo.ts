import { dbEngine } from '../db';
import { FocusSession, SessionType } from '../../types';
import { getTodayDateString } from '../../utils/date';

export const focusRepository = {
  getAll(): FocusSession[] {
    const db = dbEngine.getTables();
    return Object.values(db.focusSessions).sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    );
  },

  logSession(params: {
    taskId?: string;
    taskTitle?: string;
    durationSeconds: number;
    targetDurationSeconds: number;
    completed: boolean;
    interrupted: boolean;
    sessionType: SessionType;
    date?: string;
    notes?: string;
  }): FocusSession {
    const id = `focus_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const date = params.date || getTodayDateString();

    const session: FocusSession = {
      id,
      taskId: params.taskId,
      taskTitle: params.taskTitle,
      durationSeconds: params.durationSeconds,
      targetDurationSeconds: params.targetDurationSeconds,
      completed: params.completed,
      interrupted: params.interrupted,
      sessionType: params.sessionType,
      date,
      timestamp: now,
      notes: params.notes,
    };

    dbEngine.runTransaction((db) => {
      db.focusSessions[id] = session;
    });

    return session;
  },

  create(params: {
    mode: SessionType;
    durationMinutes: number;
    completed: boolean;
    date: string;
    startTime?: string;
    endTime?: string;
    taskId?: string;
    taskTitle?: string;
  }): FocusSession {
    return this.logSession({
      taskId: params.taskId,
      taskTitle: params.taskTitle,
      durationSeconds: params.durationMinutes * 60,
      targetDurationSeconds: params.durationMinutes * 60,
      completed: params.completed,
      interrupted: false,
      sessionType: params.mode,
      date: params.date,
    });
  },

  getStats() {
    const sessions = this.getAll().filter((s) => s.sessionType === 'FOCUS');
    const todayStr = getTodayDateString();

    // Calculate today's focus seconds
    const todaySeconds = sessions
      .filter((s) => s.date === todayStr)
      .reduce((acc, s) => acc + s.durationSeconds, 0);

    // Calculate this week's focus seconds (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

    const weekSeconds = sessions
      .filter((s) => s.date >= startStr)
      .reduce((acc, s) => acc + s.durationSeconds, 0);

    const totalCompleted = sessions.filter((s) => s.completed).length;
    const avgDurationSeconds =
      sessions.length > 0
        ? Math.round(
            sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / sessions.length
          )
        : 0;

    return {
      todaySeconds,
      weekSeconds,
      totalSessions: sessions.length,
      completedSessions: totalCompleted,
      avgDurationSeconds,
    };
  },
};
