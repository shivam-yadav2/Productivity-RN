export type TaskStatus = 'INBOX' | 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO date "YYYY-MM-DD"
  dueTime?: string; // "HH:mm"
  tags?: string[];
  reminderTime?: string;
  linkedAccountId?: string;
  estimatedMinutes?: number;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

export type HabitFrequency = 'DAILY' | 'WEEKDAYS' | 'WEEKLY_TARGET';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  targetDaysPerWeek: number;
  /** "HH:mm" times of day this habit reminds at — can be more than one per day. */
  reminderTimes?: string[];
  /** Scheduled notification identifiers, one per `reminderTimes` entry, in the same
   *  order — needed to cancel/reschedule the right ones when reminderTimes changes. */
  reminderNotificationIds?: string[];
  startDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // ISO date "YYYY-MM-DD"
  completedAt: string;
  notes?: string;
}

export type SessionType = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
export type FocusMode = SessionType;

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  durationSeconds: number;
  durationMinutes?: number;
  targetDurationSeconds: number;
  completed: boolean;
  interrupted: boolean;
  sessionType: SessionType;
  mode?: SessionType;
  date: string; // "YYYY-MM-DD"
  startTime?: string;
  endTime?: string;
  timestamp: string;
  notes?: string;
}

export interface FocusSettings {
  focusDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}
