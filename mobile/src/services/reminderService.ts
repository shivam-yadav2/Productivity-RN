import * as Notifications from 'expo-notifications';
import { Reminder } from '../types';
import { reminderRepository } from '../database/repositories/reminderRepo';
import { notificationService } from './notificationService';
import {
  isAlarmModuleAvailable,
  scheduleAlarm,
  cancelAlarm,
  canScheduleExactAlarms,
  openExactAlarmSettings,
} from '../../modules/expo-alarm';

/**
 * How many upcoming occurrences of a repeating alarm are registered at once.
 *
 * Android's AlarmManager holds a single moment per alarm, not a schedule, and nothing of
 * ours is running when one fires to book the next — so a repeating reminder is expanded
 * into a run of individual alarms and topped back up every time the app opens.
 */
const ALARM_OCCURRENCES = 14;

/** Seconds a native alarm rings before giving up on its own. */
const RING_SECONDS = 120;

/** Stable positive 31-bit-safe base id, so a reminder maps to the same alarm ids every run. */
function baseAlarmId(reminderId: string): number {
  let hash = 0;
  for (let i = 0; i < reminderId.length; i++) {
    hash = (hash * 31 + reminderId.charCodeAt(i)) | 0;
  }
  // Leave room for ALARM_OCCURRENCES consecutive ids above the base without overflowing.
  return Math.abs(hash % 20_000_000) * 100;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

/** True when `date` is a day this reminder should fire on. */
function matchesRepeat(reminder: Reminder, date: Date): boolean {
  const weekday = date.getDay();
  switch (reminder.repeat) {
    case 'DAILY':
      return true;
    case 'WEEKDAYS':
      return weekday >= 1 && weekday <= 5;
    case 'CUSTOM':
      return (reminder.days || []).includes(weekday);
    case 'ONCE':
    default:
      return true;
  }
}

/**
 * The next `count` moments this reminder fires, as epoch millis, always strictly in the
 * future. A one-off that has already passed yields nothing.
 */
export function nextOccurrences(reminder: Reminder, count: number): number[] {
  const { hour, minute } = parseTime(reminder.time);
  const now = Date.now();

  if (reminder.repeat === 'ONCE') {
    if (!reminder.date) return [];
    const [y, m, d] = reminder.date.split('-').map(Number);
    const when = new Date(y, (m || 1) - 1, d || 1, hour, minute, 0, 0).getTime();
    return when > now ? [when] : [];
  }

  const out: number[] = [];
  const cursor = new Date();
  cursor.setHours(hour, minute, 0, 0);

  // Scan forward day by day; 400 days is well past any weekly pattern needing 14 hits.
  for (let i = 0; i < 400 && out.length < count; i++) {
    const candidate = new Date(cursor);
    candidate.setDate(cursor.getDate() + i);
    if (candidate.getTime() > now && matchesRepeat(reminder, candidate)) {
      out.push(candidate.getTime());
    }
  }
  return out;
}

/** Human-readable summary of when a reminder fires, for the list row. */
export function describeSchedule(reminder: Reminder): string {
  const { hour, minute } = parseTime(reminder.time);
  const label = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  switch (reminder.repeat) {
    case 'DAILY':
      return `Every day · ${label}`;
    case 'WEEKDAYS':
      return `Weekdays · ${label}`;
    case 'CUSTOM': {
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const picked = (reminder.days || []).slice().sort().map((d) => names[d]);
      return picked.length ? `${picked.join(', ')} · ${label}` : label;
    }
    case 'ONCE':
    default: {
      if (!reminder.date) return label;
      const [y, m, d] = reminder.date.split('-').map(Number);
      const dateLabel = new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `${dateLabel} · ${label}`;
    }
  }
}

/** Cancels every OS registration belonging to a reminder — alarms and notifications both. */
export async function unscheduleReminder(reminder: Reminder): Promise<void> {
  const base = baseAlarmId(reminder.id);
  for (let i = 0; i < ALARM_OCCURRENCES; i++) {
    cancelAlarm(base + i);
  }
  for (const id of reminder.notificationIds || []) {
    await notificationService.cancel(id);
  }
}

/**
 * Registers a reminder with the OS and records the identifiers it created.
 * Safe to call repeatedly — it cancels whatever the reminder had registered first.
 */
export async function scheduleReminder(reminder: Reminder): Promise<Reminder> {
  await unscheduleReminder(reminder);

  if (!reminder.isEnabled) {
    return reminderRepository.update(reminder.id, { notificationIds: [] });
  }

  const notificationIds: string[] = [];

  if (reminder.style === 'ALARM' && isAlarmModuleAvailable) {
    const base = baseAlarmId(reminder.id);
    const occurrences = nextOccurrences(reminder, ALARM_OCCURRENCES);
    occurrences.forEach((triggerAtMillis, i) => {
      scheduleAlarm({
        id: base + i,
        triggerAtMillis,
        title: reminder.title,
        body: reminder.note || '',
        snoozeMinutes: reminder.snoozeMinutes,
        ringSeconds: RING_SECONDS,
      });
    });
  } else {
    // NOTIFICATION style, or ALARM on a build without the native module: fall back to
    // ordinary scheduled notifications so the reminder still arrives, just quietly.
    const granted = await notificationService.requestPermission();
    if (granted) {
      const { hour, minute } = parseTime(reminder.time);

      if (reminder.repeat === 'DAILY') {
        const id = await notificationService.scheduleDaily(
          `rem_${reminder.id}`,
          reminder.title,
          reminder.note || 'Reminder',
          hour,
          minute
        );
        if (id) notificationIds.push(id);
      } else {
        // Everything else is expanded the same way alarms are, since expo-notifications
        // has no "weekdays" or "these specific days" trigger.
        const occurrences = nextOccurrences(reminder, ALARM_OCCURRENCES);
        for (let i = 0; i < occurrences.length; i++) {
          const id = await notificationService.scheduleAt(
            `rem_${reminder.id}_${i}`,
            reminder.title,
            reminder.note || 'Reminder',
            new Date(occurrences[i])
          );
          if (id) notificationIds.push(id);
        }
      }
    }
  }

  return reminderRepository.update(reminder.id, { notificationIds });
}

/**
 * Re-registers everything on app start: tops up repeating alarms whose expanded
 * occurrences have been consumed, and clears out one-offs that already fired.
 */
export async function syncAllReminders(): Promise<void> {
  const reminders = reminderRepository.getAll();
  const expired: string[] = [];

  for (const reminder of reminders) {
    if (!reminder.isEnabled) continue;

    if (reminder.repeat === 'ONCE' && nextOccurrences(reminder, 1).length === 0) {
      // A one-off in the past has done its job — countdowns are removed outright, while
      // a user-created one is kept but switched off so it stays visible in the list.
      if (reminder.isCountdown) {
        expired.push(reminder.id);
      } else {
        reminderRepository.update(reminder.id, { isEnabled: false, notificationIds: [] });
      }
      continue;
    }

    await scheduleReminder(reminder);
  }

  reminderRepository.deleteMany(expired);
}

/** Cancels every reminder's OS registrations — used before wiping app data. */
export async function unscheduleAllReminders(): Promise<void> {
  for (const reminder of reminderRepository.getAll()) {
    await unscheduleReminder(reminder);
  }
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

export const alarmPermissions = {
  isSupported: isAlarmModuleAvailable,
  canScheduleExact: canScheduleExactAlarms,
  openSettings: openExactAlarmSettings,
};
