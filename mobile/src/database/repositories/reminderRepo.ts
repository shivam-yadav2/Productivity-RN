import { dbEngine } from '../db';
import { Reminder, ReminderRepeat, ReminderStyle } from '../../types';

export const reminderRepository = {
  getAll(): Reminder[] {
    const db = dbEngine.getTables();
    return Object.values(db.reminders).sort((a, b) => {
      // Enabled first, then by time of day, so the next thing to fire reads at the top.
      if (a.isEnabled !== b.isEnabled) return a.isEnabled ? -1 : 1;
      return a.time.localeCompare(b.time);
    });
  },

  getById(id: string): Reminder | undefined {
    return dbEngine.getTables().reminders[id];
  },

  create(params: {
    title: string;
    note?: string;
    time: string;
    date?: string;
    repeat?: ReminderRepeat;
    days?: number[];
    style?: ReminderStyle;
    snoozeMinutes?: number;
    isCountdown?: boolean;
  }): Reminder {
    if (!params.title.trim()) {
      throw new Error('Reminder needs a title.');
    }

    const id = `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const reminder: Reminder = {
      id,
      title: params.title.trim(),
      note: params.note?.trim() || undefined,
      time: params.time,
      date: params.date,
      repeat: params.repeat || 'ONCE',
      days: params.days,
      style: params.style || 'ALARM',
      snoozeMinutes: params.snoozeMinutes ?? 5,
      isEnabled: true,
      isCountdown: params.isCountdown,
      createdAt: now,
      updatedAt: now,
    };

    dbEngine.runTransaction((db) => {
      db.reminders[id] = reminder;
    });

    return reminder;
  },

  update(id: string, params: Partial<Omit<Reminder, 'id' | 'createdAt'>>): Reminder {
    const existing = dbEngine.getTables().reminders[id];
    if (!existing) throw new Error(`Reminder ${id} not found.`);

    const updated: Reminder = {
      ...existing,
      ...params,
      updatedAt: new Date().toISOString(),
    };

    dbEngine.runTransaction((db) => {
      db.reminders[id] = updated;
    });

    return updated;
  },

  delete(id: string): void {
    dbEngine.runTransaction((db) => {
      delete db.reminders[id];
    });
  },

  /** Used after a one-off reminder fires, and by the reset flow, to sweep dead entries. */
  deleteMany(ids: string[]): void {
    if (ids.length === 0) return;
    dbEngine.runTransaction((db) => {
      ids.forEach((id) => delete db.reminders[id]);
    });
  },
};
