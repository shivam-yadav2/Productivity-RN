import { Transaction, Task, Habit, AppDocument, Note, SavingsGoal, Debt, Reminder } from '../types';
import { transactionRepository } from '../database/repositories/transactionRepo';
import { taskRepository } from '../database/repositories/taskRepo';
import { habitRepository } from '../database/repositories/habitRepo';
import { documentRepository } from '../database/repositories/documentRepo';
import { noteRepository } from '../database/repositories/noteRepo';
import { goalRepository } from '../database/repositories/goalRepo';
import { debtRepository } from '../database/repositories/debtRepo';
import { reminderRepository } from '../database/repositories/reminderRepo';
import { formatCurrency } from '../utils/currency';
import { formatDateDisplay } from '../utils/date';

export type SearchResult =
  | { type: 'transaction'; id: string; title: string; subtitle: string; item: Transaction }
  | { type: 'task'; id: string; title: string; subtitle: string; item: Task }
  | { type: 'habit'; id: string; title: string; subtitle: string; item: Habit }
  | { type: 'document'; id: string; title: string; subtitle: string; item: AppDocument }
  | { type: 'note'; id: string; title: string; subtitle: string; item: Note }
  | { type: 'goal'; id: string; title: string; subtitle: string; item: SavingsGoal }
  | { type: 'debt'; id: string; title: string; subtitle: string; item: Debt }
  | { type: 'reminder'; id: string; title: string; subtitle: string; item: Reminder };

const MAX_PER_TYPE = 8;

function matches(haystack: (string | undefined)[], q: string): boolean {
  return haystack.some((h) => h?.toLowerCase().includes(q));
}

/** Case-insensitive substring search across every user-created entity in the app. */
export function searchAll(query: string, currency: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  transactionRepository
    .filter({ query: q })
    .slice(0, MAX_PER_TYPE)
    .forEach((tx) => {
      results.push({
        type: 'transaction',
        id: tx.id,
        title: tx.note || `${tx.type.charAt(0)}${tx.type.slice(1).toLowerCase()}`,
        subtitle: `${formatCurrency(tx.amountMinor, currency)} • ${formatDateDisplay(tx.date)}`,
        item: tx,
      });
    });

  taskRepository
    .getAll()
    .filter((t) => matches([t.title, t.description, ...(t.tags || [])], q))
    .slice(0, MAX_PER_TYPE)
    .forEach((task) => {
      results.push({
        type: 'task',
        id: task.id,
        title: task.title,
        subtitle: task.dueDate ? `Due ${formatDateDisplay(task.dueDate)}` : task.status,
        item: task,
      });
    });

  habitRepository
    .getAll(false)
    .filter((h) => matches([h.name, h.description], q))
    .slice(0, MAX_PER_TYPE)
    .forEach((habit) => {
      results.push({
        type: 'habit',
        id: habit.id,
        title: habit.name,
        subtitle: habit.description || 'Habit',
        item: habit,
      });
    });

  documentRepository
    .getAll()
    .filter((d) => matches([d.name, d.originalFileName], q))
    .slice(0, MAX_PER_TYPE)
    .forEach((doc) => {
      results.push({
        type: 'document',
        id: doc.id,
        title: doc.name,
        subtitle: `Document • ${formatDateDisplay(doc.createdAt.split('T')[0])}`,
        item: doc,
      });
    });

  noteRepository
    .getAll()
    .filter((n) => matches([n.title, n.body], q))
    .slice(0, MAX_PER_TYPE)
    .forEach((note) => {
      results.push({
        type: 'note',
        id: note.id,
        title: note.title || note.body.slice(0, 60) || 'Untitled note',
        subtitle: 'Note',
        item: note,
      });
    });

  goalRepository
    .getAll()
    .filter((g) => matches([g.name], q))
    .slice(0, MAX_PER_TYPE)
    .forEach((goal) => {
      results.push({
        type: 'goal',
        id: goal.id,
        title: goal.name,
        subtitle: `Savings goal · ${formatCurrency(goal.savedAmountMinor, currency)} of ${formatCurrency(goal.targetAmountMinor, currency)}`,
        item: goal,
      });
    });

  debtRepository
    .getAll()
    .filter((d) => matches([d.name], q))
    .slice(0, MAX_PER_TYPE)
    .forEach((debt) => {
      results.push({
        type: 'debt',
        id: debt.id,
        title: debt.name,
        subtitle: `Debt · ${formatCurrency(debt.currentBalanceMinor, currency)} remaining`,
        item: debt,
      });
    });

  reminderRepository
    .getAll()
    .filter((r) => matches([r.title, r.note], q))
    .slice(0, MAX_PER_TYPE)
    .forEach((reminder) => {
      results.push({
        type: 'reminder',
        id: reminder.id,
        title: reminder.title,
        subtitle: `Reminder · ${reminder.isEnabled ? reminder.time : 'off'}`,
        item: reminder,
      });
    });

  return results;
}
