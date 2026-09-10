/** How a reminder repeats. `CUSTOM` uses `days` (0 = Sunday … 6 = Saturday). */
export type ReminderRepeat = 'ONCE' | 'DAILY' | 'WEEKDAYS' | 'CUSTOM';

/**
 * ALARM rings loudly over the lock screen until dismissed (native alarm path).
 * NOTIFICATION is an ordinary heads-up nudge with the system's default sound.
 */
export type ReminderStyle = 'ALARM' | 'NOTIFICATION';

export interface Reminder {
  id: string;
  title: string;
  note?: string;
  /** "HH:mm" local time of day the reminder fires. */
  time: string;
  /** "YYYY-MM-DD" — only meaningful for `ONCE`. */
  date?: string;
  repeat: ReminderRepeat;
  /** Weekday numbers for `CUSTOM`, 0 = Sunday. Ignored otherwise. */
  days?: number[];
  style: ReminderStyle;
  /** Minutes added when the user hits Snooze. 0 disables snoozing. */
  snoozeMinutes: number;
  isEnabled: boolean;
  /**
   * Scheduled `expo-notifications` identifiers, so an edit or a disable can cancel
   * exactly what it previously created rather than guessing.
   */
  notificationIds?: string[];
  /** Set when this reminder was created by the quick countdown ("remind me in 45m"). */
  isCountdown?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
export const WEEKDAY_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Durations offered by the quick countdown / sleep-timer row, in minutes. */
export const COUNTDOWN_PRESETS = [15, 30, 45, 60, 90, 120] as const;
