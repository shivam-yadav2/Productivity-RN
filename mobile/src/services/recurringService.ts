import { RecurringTransaction, RecurringFrequency } from '../types';
import { dbEngine } from '../database/db';
import { recurringRepository } from '../database/repositories/recurringRepo';
import { transactionRepository } from '../database/repositories/transactionRepo';
import { getTodayDateString } from '../utils/date';

/**
 * Turns recurring rules into real transactions.
 *
 * Before this existed, a recurring rule only ever produced a reminder notification —
 * `nextDueDate` never moved and no transaction was created, so "Scheduled & Subscriptions"
 * was a list of rules that never did anything. This runs on app start and posts every
 * occurrence that has come due since the last time the app was opened.
 */

/** How far back to catch up. A rule dormant longer than this resumes from today rather
 *  than flooding the ledger with a year of back-dated entries the user never saw. */
const MAX_CATCHUP_OCCURRENCES = 60;

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * The day after `dateStr` for a given frequency.
 *
 * Monthly and yearly clamp to the end of the target month, so a rule on the 31st lands on
 * the 28th/30th in shorter months instead of rolling into the next one — which is what a
 * naive `setMonth(+1)` does, and it would silently shift a rent day forward every year.
 */
export function advanceDate(dateStr: string, frequency: RecurringFrequency): string {
  const date = parseDate(dateStr);

  switch (frequency) {
    case 'DAILY':
      date.setDate(date.getDate() + 1);
      return toDateString(date);
    case 'WEEKLY':
      date.setDate(date.getDate() + 7);
      return toDateString(date);
    case 'MONTHLY':
    case 'YEARLY': {
      const monthsToAdd = frequency === 'MONTHLY' ? 1 : 12;
      const targetDay = date.getDate();
      const target = new Date(date.getFullYear(), date.getMonth() + monthsToAdd, 1);
      const daysInTargetMonth = new Date(
        target.getFullYear(),
        target.getMonth() + 1,
        0
      ).getDate();
      target.setDate(Math.min(targetDay, daysInTargetMonth));
      return toDateString(target);
    }
    default:
      return dateStr;
  }
}

export interface PostedSummary {
  /** How many transactions were actually created. */
  posted: number;
  /** Rules that advanced, by id. */
  ruleIds: string[];
}

/**
 * Posts every occurrence due on or before today and advances each rule's `nextDueDate`.
 * Safe to call repeatedly — a rule whose next due date is in the future is left alone.
 */
export function postDueRecurringTransactions(): PostedSummary {
  const today = getTodayDateString();
  const rules = recurringRepository.getAll(true);
  const summary: PostedSummary = { posted: 0, ruleIds: [] };

  for (const rule of rules) {
    if (!rule.isActive) continue;

    let dueDate = rule.nextDueDate;
    let iterations = 0;
    let postedForRule = 0;

    while (dueDate <= today && iterations < MAX_CATCHUP_OCCURRENCES) {
      try {
        transactionRepository.create({
          type: rule.type,
          amountMinor: rule.amountMinor,
          accountId: rule.accountId,
          destinationAccountId: rule.destinationAccountId,
          categoryId: rule.categoryId,
          date: dueDate,
          note: rule.note,
          tags: ['Recurring'],
        });
        postedForRule++;
      } catch {
        // A rule pointing at a deleted account would throw here. Skipping the occurrence
        // and still advancing keeps one broken rule from blocking every other one.
      }
      dueDate = advanceDate(dueDate, rule.frequency);
      iterations++;
    }

    // A rule dormant past the catch-up ceiling jumps forward to the next future date
    // rather than posting dozens of stale entries on the next launch.
    if (iterations >= MAX_CATCHUP_OCCURRENCES) {
      while (dueDate <= today) {
        dueDate = advanceDate(dueDate, rule.frequency);
      }
    }

    if (dueDate !== rule.nextDueDate) {
      recurringRepository.update(rule.id, { nextDueDate: dueDate });
      summary.posted += postedForRule;
      summary.ruleIds.push(rule.id);
    }
  }

  if (summary.posted > 0) {
    // Posted transactions changed account balances; recompute from source of truth.
    dbEngine.reconcileAllAccountBalances();
  }

  return summary;
}

/** Rules due within `days` from today — used for the "upcoming bills" surfaces. */
export function getUpcomingRules(days = 7): RecurringTransaction[] {
  const today = parseDate(getTodayDateString());
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + days);
  const horizonStr = toDateString(horizon);

  return recurringRepository
    .getAll(true)
    .filter((r) => r.isActive && r.nextDueDate <= horizonStr)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
}
