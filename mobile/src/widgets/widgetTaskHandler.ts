import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { dbEngine } from '../database/db';
import { habitRepository } from '../database/repositories/habitRepo';
import { taskRepository } from '../database/repositories/taskRepo';
import { formatCurrency } from '../utils/currency';
import { getTodayDateString, getPastDaysList } from '../utils/date';
import { BalanceWidget } from './BalanceWidget';
import { HabitStreakWidget, HabitStreakRow } from './HabitStreakWidget';
import { TodayWidget } from './TodayWidget';
import { QuickAddWidget } from './QuickAddWidget';

const MAX_HABIT_ROWS = 3;
const STREAK_DAYS = 7;

/**
 * Widgets run in a headless JS instance separate from the main app's React tree — there's
 * no DatabaseProvider here, so each render reaches straight into dbEngine/repos, the same
 * way the app's own root does on cold start.
 */
async function renderBalanceWidget() {
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

  return React.createElement(BalanceWidget, {
    balanceText: formatCurrency(totalBalanceMinor, currency, { compact: true }),
    spentTodayText: formatCurrency(spentTodayMinor, currency, { compact: true }),
  });
}

async function renderHabitStreakWidget() {
  await dbEngine.init();
  const habits = habitRepository.getAll();
  const today = getTodayDateString();
  const doneToday = habits.filter((h) => habitRepository.isCompletedToday(h.id, today)).length;
  const lastDays = getPastDaysList(STREAK_DAYS);

  const rows: HabitStreakRow[] = habits.slice(0, MAX_HABIT_ROWS).map((h) => {
    const { loggedDates } = habitRepository.getStats(h.id);
    return {
      name: h.name,
      color: h.color,
      days: lastDays.map((d) => loggedDates.has(d)),
    };
  });

  return React.createElement(HabitStreakWidget, { doneToday, totalHabits: habits.length, rows });
}

async function renderTodayWidget() {
  await dbEngine.init();
  const today = getTodayDateString();
  const tasks = taskRepository
    .getAll()
    .filter((t) => t.status !== 'COMPLETED' && (t.dueDate === today || t.priority === 'URGENT'));

  const now = new Date();

  return React.createElement(TodayWidget, {
    dayName: now.toLocaleDateString('en-US', { weekday: 'short' }),
    monthName: now.toLocaleDateString('en-US', { month: 'short' }),
    dayNumber: String(now.getDate()),
    taskCount: tasks.length,
    nextTaskTitle: tasks[0]?.title ?? null,
  });
}

function renderQuickAddWidget() {
  return React.createElement(QuickAddWidget, {});
}

export async function renderWidgetByName(widgetName: string) {
  switch (widgetName) {
    case 'Balance':
      return renderBalanceWidget();
    case 'HabitStreak':
      return renderHabitStreakWidget();
    case 'Today':
      return renderTodayWidget();
    case 'QuickAdd':
      return renderQuickAddWidget();
    default:
      return null;
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const widget = await renderWidgetByName(props.widgetInfo.widgetName);
      if (widget) props.renderWidget(widget);
      break;
    }
    // OPEN_URI click actions (used by every widget here) are handled by the library
    // itself in the background — they never reach this handler as WIDGET_CLICK.
    case 'WIDGET_DELETED':
    default:
      break;
  }
}
