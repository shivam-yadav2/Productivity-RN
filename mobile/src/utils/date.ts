/**
 * Date utilities for offline ledger and productivity.
 * Uses ISO strings (YYYY-MM-DD) for clean database sorting and indexing.
 */

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateDisplay(isoDateStr: string): string {
  if (!isoDateStr) return '';
  const [year, month, day] = isoDateStr.split('-').map(Number);
  if (!year || !month || !day) return isoDateStr;

  const todayStr = getTodayDateString();
  if (isoDateStr === todayStr) return 'Today';

  const d = new Date(year, month - 1, day);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  if (isoDateStr === yesterdayStr) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
}

export function formatFullDate(isoDateStr: string, timeStr?: string): string {
  if (!isoDateStr) return '';
  const [year, month, day] = isoDateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const formattedDate = d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (!timeStr) return formattedDate;
  return `${formattedDate} • ${formatTimeDisplay(timeStr)}`;
}

export function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function getGreetingTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function formatShortDay(isoDateStr: string): string {
  if (!isoDateStr) return '';
  const [year, month, day] = isoDateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'narrow' });
}

export function getPastDaysList(count = 7): string[] {
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

export function getMonthYearKey(dateStr = getTodayDateString()): string {
  return dateStr.substring(0, 7); // "YYYY-MM"
}

export function formatMonthYear(monthYearKey: string): string {
  if (!monthYearKey || monthYearKey.length < 7) return monthYearKey;
  const [year, month] = monthYearKey.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export function getDateRangeForPeriod(
  period: 'today' | 'week' | 'month' | 'last_month' | 'year' | 'all'
): DateRange {
  const now = new Date();
  const todayStr = getTodayDateString();

  if (period === 'today') {
    return { startDate: todayStr, endDate: todayStr, label: 'Today' };
  }

  if (period === 'week') {
    // Current week starting from Monday
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    const startStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    return { startDate: startStr, endDate: todayStr, label: 'This Week' };
  }

  if (period === 'month') {
    const startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    return { startDate: startStr, endDate: todayStr, label: 'This Month' };
  }

  if (period === 'last_month') {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
    const endStr = `${lastDayLastMonth.getFullYear()}-${String(lastDayLastMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayLastMonth.getDate()).padStart(2, '0')}`;
    return { startDate: startStr, endDate: endStr, label: 'Last Month' };
  }

  if (period === 'year') {
    const startStr = `${now.getFullYear()}-01-01`;
    return { startDate: startStr, endDate: todayStr, label: 'This Year' };
  }

  return { startDate: '1970-01-01', endDate: '2099-12-31', label: 'All Time' };
}
