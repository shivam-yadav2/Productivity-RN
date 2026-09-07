export type WidgetName = 'Balance' | 'HabitStreak' | 'Today' | 'QuickAdd';

/** 'auto' follows the phone's own light/dark setting; the other two pin the widget. */
export type WidgetThemeMode = 'auto' | 'light' | 'dark';

export type WidgetAccent = 'neutral' | 'purple' | 'orange' | 'blue' | 'pink';

/**
 * Per-instance widget settings. Keyed by the Android `widgetId`, so two copies of the
 * same widget pinned to the home screen can be configured differently (e.g. one dark
 * Balance widget with the amount hidden, one light one showing it).
 */
export interface WidgetConfig {
  id: string;
  widgetName: WidgetName;
  theme: WidgetThemeMode;
  accent: WidgetAccent;
  /** Balance: blur out the amount, for a widget sitting on a shared/visible home screen. */
  hideAmount?: boolean;
  /** HabitStreak: how many days of history each dot-row shows. */
  streakDays?: number;
  /** Today: show the next task's title under the count. */
  showNextTask?: boolean;
  updatedAt: string;
}

export const DEFAULT_WIDGET_CONFIG: Omit<WidgetConfig, 'id' | 'widgetName' | 'updatedAt'> = {
  theme: 'auto',
  accent: 'neutral',
  hideAmount: false,
  streakDays: 7,
  showNextTask: true,
};
