import React from 'react';
import type { WidgetTaskHandlerProps, WidgetInfo } from 'react-native-android-widget';
import { dbEngine } from '../database/db';
import { habitRepository } from '../database/repositories/habitRepo';
import { taskRepository } from '../database/repositories/taskRepo';
import { widgetConfigRepository } from '../database/repositories/widgetConfigRepo';
import { formatCurrency } from '../utils/currency';
import { getTodayDateString, getPastDaysList } from '../utils/date';
import { WidgetConfig, WidgetName } from '../types';
import { widgetPalette, WidgetVariant } from './widgetTheme';
import { BalanceWidget } from './BalanceWidget';
import { HabitStreakWidget, HabitStreakRow } from './HabitStreakWidget';
import { TodayWidget } from './TodayWidget';
import { QuickAddWidget } from './QuickAddWidget';

const MAX_HABIT_ROWS = 5;

/**
 * Widgets run in a headless JS instance separate from the main app's React tree — there's
 * no DatabaseProvider here, so each render reaches straight into dbEngine/repos, the same
 * way the app's own root does on cold start.
 */

/** Builds one variant (light or dark) of a widget. Called once or twice per render
 *  depending on whether the widget's theme is pinned or set to follow the system. */
type VariantRenderer = (variant: WidgetVariant) => React.JSX.Element;

/**
 * 'auto' hands the launcher both variants so it can switch with the system theme;
 * a pinned theme returns a single element, which the launcher then uses in both modes.
 */
function represent(config: WidgetConfig, render: VariantRenderer) {
  if (config.theme === 'light') return render('light');
  if (config.theme === 'dark') return render('dark');
  return { light: render('light'), dark: render('dark') };
}

async function balanceRenderer(info: WidgetInfo, config: WidgetConfig): Promise<VariantRenderer> {
  await dbEngine.init();
  const db = dbEngine.getTables();
  const totalBalanceMinor = Object.values(db.accounts)
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + a.currentBalanceMinor, 0);
  const currency = db.settings.currency || 'INR';

  const today = getTodayDateString();
  const spentTodayMinor = Object.values(db.transactions)
    .filter((t) => t.date === today && t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amountMinor, 0);

  return (variant) =>
    React.createElement(BalanceWidget, {
      balanceText: formatCurrency(totalBalanceMinor, currency, { compact: true }),
      spentTodayText: formatCurrency(spentTodayMinor, currency, { compact: true }),
      palette: widgetPalette(variant, config.accent),
      width: info.width,
      height: info.height,
      hideAmount: config.hideAmount,
    });
}

async function habitStreakRenderer(info: WidgetInfo, config: WidgetConfig): Promise<VariantRenderer> {
  await dbEngine.init();
  const habits = habitRepository.getAll();
  const today = getTodayDateString();
  const doneToday = habits.filter((h) => habitRepository.isCompletedToday(h.id, today)).length;
  const lastDays = getPastDaysList(config.streakDays || 7);

  const rows: HabitStreakRow[] = habits.slice(0, MAX_HABIT_ROWS).map((h) => {
    const { loggedDates } = habitRepository.getStats(h.id);
    return {
      name: h.name,
      color: h.color,
      days: lastDays.map((d) => loggedDates.has(d)),
    };
  });

  return (variant) =>
    React.createElement(HabitStreakWidget, {
      doneToday,
      totalHabits: habits.length,
      rows,
      palette: widgetPalette(variant, config.accent),
      width: info.width,
      height: info.height,
      useHabitColors: config.accent === 'neutral',
    });
}

async function todayRenderer(info: WidgetInfo, config: WidgetConfig): Promise<VariantRenderer> {
  await dbEngine.init();
  const today = getTodayDateString();
  const tasks = taskRepository
    .getAll()
    .filter((t) => t.status !== 'COMPLETED' && (t.dueDate === today || t.priority === 'URGENT'));

  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = now.toLocaleDateString('en-US', { month: 'short' });
  const dayNumber = String(now.getDate());

  return (variant) =>
    React.createElement(TodayWidget, {
      dayName,
      monthName,
      dayNumber,
      taskCount: tasks.length,
      nextTaskTitle: tasks[0]?.title ?? null,
      palette: widgetPalette(variant, config.accent),
      width: info.width,
      height: info.height,
      showNextTask: config.showNextTask !== false,
    });
}

function quickAddRenderer(info: WidgetInfo, config: WidgetConfig): VariantRenderer {
  return (variant) =>
    React.createElement(QuickAddWidget, {
      palette: widgetPalette(variant, config.accent),
      height: info.height,
      accentName: config.accent,
      isDark: variant === 'dark',
    });
}

/** Renders a widget using its saved configuration (or defaults if it has none yet). */
export async function renderConfiguredWidget(info: WidgetInfo, overrideConfig?: WidgetConfig) {
  const widgetName = info.widgetName as WidgetName;
  await dbEngine.init();
  const config = overrideConfig ?? widgetConfigRepository.get(info.widgetId, widgetName);

  switch (widgetName) {
    case 'Balance':
      return represent(config, await balanceRenderer(info, config));
    case 'HabitStreak':
      return represent(config, await habitStreakRenderer(info, config));
    case 'Today':
      return represent(config, await todayRenderer(info, config));
    case 'QuickAdd':
      return represent(config, quickAddRenderer(info, config));
    default:
      return null;
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const widget = await renderConfiguredWidget(props.widgetInfo);
      if (widget) props.renderWidget(widget);
      break;
    }
    case 'WIDGET_DELETED':
      // Drop the saved config so a future widget reusing this id starts from defaults
      // rather than inheriting a deleted widget's look.
      await dbEngine.init();
      widgetConfigRepository.delete(props.widgetInfo.widgetId);
      break;
    // OPEN_URI click actions (used by every widget here) are handled by the library
    // itself in the background — they never reach this handler as WIDGET_CLICK.
    default:
      break;
  }
}
