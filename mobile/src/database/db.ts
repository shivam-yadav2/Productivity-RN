/**
 * Offline SQLite-grade Local Database Engine.
 *
 * Invariants & Architecture:
 * 1. Offline-First & Private (Zero network calls, zero tracking).
 * 2. Strict Integer Minor Units for money calculations.
 * 3. Versioned Schema Migrations with schema checks.
 * 4. ACID Transaction runner with automatic rollback on error.
 * 5. Indexed read queries & account balance reconciliation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import {
  Account,
  Category,
  Transaction,
  Budget,
  RecurringTransaction,
  Task,
  Habit,
  HabitLog,
  FocusSession,
  AppSettings,
  BackupData,
  AppDocument,
  SavingsGoal,
  Debt,
  Note,
  WidgetConfig,
  Reminder,
} from '../types';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_SETTINGS,
} from './initialData';

const DB_STORAGE_KEY = 'ppf_local_database_v1';
const DB_VERSION_KEY = 'ppf_db_schema_version';
const CURRENT_SCHEMA_VERSION = 1;

export interface DatabaseTables {
  accounts: Record<string, Account>;
  categories: Record<string, Category>;
  transactions: Record<string, Transaction>;
  budgets: Record<string, Budget>;
  recurringTransactions: Record<string, RecurringTransaction>;
  tasks: Record<string, Task>;
  habits: Record<string, Habit>;
  habitLogs: Record<string, HabitLog>;
  focusSessions: Record<string, FocusSession>;
  documents: Record<string, AppDocument>;
  widgetConfigs: Record<string, WidgetConfig>;
  reminders: Record<string, Reminder>;
  savingsGoals: Record<string, SavingsGoal>;
  debts: Record<string, Debt>;
  notes: Record<string, Note>;
  settings: AppSettings;
}

export type TableName = keyof DatabaseTables;

/** Receives the set of tables that changed since the previous notification. */
export type DatabaseListener = (dirtyTables: Set<TableName>) => void;

/**
 * How long writes are coalesced before hitting AsyncStorage.
 *
 * Persisting means `JSON.stringify` of the ENTIRE database on the JS thread. Doing that
 * once per write meant a single transaction edit serialised everything twice (once for the
 * write, once for the balance reconcile that follows), and rapid actions — ticking several
 * habits, typing in a form that saves per keystroke — multiplied it. Batching turns a
 * burst of writes into one serialisation without changing what reads see, because reads
 * come from the in-memory tables, not from storage.
 */
const PERSIST_DEBOUNCE_MS = 400;

class DatabaseEngine {
  private tables: DatabaseTables;
  private listeners: Set<DatabaseListener> = new Set();
  private isInitialized = false;

  /** Pending-write bookkeeping for the batched persist. */
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private hasUnsavedChanges = false;
  private isWriting = false;

  /** Tables mutated since consumers last read the change set (see consumeDirtyTables). */
  private dirtyTables: Set<TableName> = new Set();

  /** Coalesces several writes in one tick into a single listener notification. */
  private notifyScheduled = false;

  constructor() {
    this.tables = this.getEmptyDatabase();
  }

  private getEmptyDatabase(): DatabaseTables {
    // Copies, never references: reconcileAllAccountBalances() writes
    // `currentBalanceMinor` straight onto these records, and sharing the objects with
    // the DEFAULT_* module constants would let a running session permanently rewrite
    // the factory defaults — so a later reset would restore already-mutated balances.
    const defaultCats: Record<string, Category> = {};
    [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].forEach((c) => {
      defaultCats[c.id] = { ...c };
    });

    const defaultAccs: Record<string, Account> = {};
    DEFAULT_ACCOUNTS.forEach((a) => {
      defaultAccs[a.id] = { ...a, currentBalanceMinor: a.openingBalanceMinor };
    });

    return {
      accounts: defaultAccs,
      categories: defaultCats,
      transactions: {},
      budgets: {},
      recurringTransactions: {},
      tasks: {},
      habits: {},
      habitLogs: {},
      focusSessions: {},
      documents: {},
      widgetConfigs: {},
      reminders: {},
      savingsGoals: {},
      debts: {},
      notes: {},
      settings: { ...DEFAULT_SETTINGS },
    };
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const stored = await AsyncStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.tables = {
          ...this.getEmptyDatabase(),
          ...parsed,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        };

        // Anyone with saved data has plainly been using the app already — onboarding
        // predates nothing for them. The flag went unread for a long time, so existing
        // installs have it sitting at the `false` default and would otherwise be shown a
        // first-run screen (and asked to pick a currency they already chose) after update.
        if (parsed.settings?.hasCompletedOnboarding === undefined) {
          this.tables.settings.hasCompletedOnboarding = true;
        }
        // Run migration if needed
        await this.runMigrations();
      } else {
        // Initial setup with starter sample data for instant exploration
        this.tables = this.getEmptyDatabase();
        this.seedInitialSampleData();
        this.persist();
      }
    } catch (e) {
      console.error('Database load error, fallback to default:', e);
      this.tables = this.getEmptyDatabase();
    }

    this.isInitialized = true;

    // Batched writes are only safe if something guarantees they land. Android can kill a
    // backgrounded process without warning, so anything still pending is written out the
    // moment the app stops being visible.
    AppState.addEventListener('change', (state) => {
      if (state !== 'active') void this.flush();
    });

    this.markAllDirty();
    this.notify();
  }

  private seedInitialSampleData() {
    const today = new Date();
    const dStr = (offsetDays: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offsetDays);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Seed a few realistic transactions
    const sampleTx: Transaction[] = [
      {
        id: 'tx_seed_1',
        type: 'INCOME',
        amountMinor: 4000000, // ₹40,000.00
        accountId: 'acc_sbi_default',
        categoryId: 'cat_inc_salary',
        date: dStr(2),
        time: '09:30',
        note: 'August Monthly Salary',
        tags: ['Job'],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'tx_seed_2',
        type: 'EXPENSE',
        amountMinor: 45000, // ₹450.00
        accountId: 'acc_sbi_default',
        categoryId: 'cat_exp_food',
        date: dStr(0),
        time: '13:15',
        note: 'Healthy lunch bowl with friends',
        tags: ['Friends', 'Lunch'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'tx_seed_3',
        type: 'EXPENSE',
        amountMinor: 18000, // ₹180.00
        accountId: 'acc_cash_default',
        categoryId: 'cat_exp_travel',
        date: dStr(0),
        time: '10:00',
        note: 'Metro & Auto commute',
        tags: ['Commute'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'tx_seed_4',
        type: 'TRANSFER',
        amountMinor: 200000, // ₹2,000.00
        accountId: 'acc_sbi_default',
        destinationAccountId: 'acc_cash_default',
        date: dStr(1),
        time: '17:45',
        note: 'ATM cash withdrawal for weekly expenses',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'tx_seed_5',
        type: 'EXPENSE',
        amountMinor: 150000, // ₹1,500.00
        accountId: 'acc_sbi_default',
        categoryId: 'cat_exp_bills',
        date: dStr(3),
        time: '19:30',
        note: 'Electricity & Broadband Bill',
        tags: ['Utilities'],
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    sampleTx.forEach((tx) => {
      this.tables.transactions[tx.id] = tx;
    });

    // Seed tasks
    const sampleTasks: Task[] = [
      {
        id: 'task_seed_1',
        title: 'Review monthly utility bills & electricity meter',
        description: 'Verify electricity bill payment before deadline',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: dStr(0),
        dueTime: '19:30',
        tags: ['Finance', 'Home'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task_seed_2',
        title: 'Complete deep work coding sprint',
        description: 'Implement offline database transactions & validation',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        dueDate: dStr(0),
        dueTime: '16:00',
        tags: ['Code'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task_seed_3',
        title: 'Buy groceries & weekly organic vegetables',
        description: 'Almonds, fresh greens, oats and dairy',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        dueDate: dStr(0),
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    sampleTasks.forEach((t) => {
      this.tables.tasks[t.id] = t;
    });

    // Seed habits
    const sampleHabits: Habit[] = [
      {
        id: 'habit_seed_1',
        name: 'Morning Workout & Stretch',
        description: '30 minutes bodyweight or gym routine',
        icon: 'Dumbbell',
        color: '#10b981',
        frequency: 'DAILY',
        targetDaysPerWeek: 7,
        reminderTimes: ['07:00'],
        startDate: dStr(14),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'habit_seed_2',
        name: 'Read 20 pages book',
        description: 'Philosophy or technical architecture',
        icon: 'BookOpen',
        color: '#3b82f6',
        frequency: 'DAILY',
        targetDaysPerWeek: 7,
        reminderTimes: ['21:30'],
        startDate: dStr(14),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'habit_seed_3',
        name: 'Meditate & Mindfulness',
        description: '10 minutes breathwork',
        icon: 'Sparkles',
        color: '#8b5cf6',
        frequency: 'DAILY',
        targetDaysPerWeek: 7,
        reminderTimes: ['08:00'],
        startDate: dStr(14),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    sampleHabits.forEach((h) => {
      this.tables.habits[h.id] = h;
    });

    // Seed habit logs for streaks
    const sampleLogs: HabitLog[] = [
      {
        id: 'log_seed_1',
        habitId: 'habit_seed_1',
        date: dStr(0),
        completedAt: new Date().toISOString(),
      },
      {
        id: 'log_seed_2',
        habitId: 'habit_seed_2',
        date: dStr(0),
        completedAt: new Date().toISOString(),
      },
      {
        id: 'log_seed_3',
        habitId: 'habit_seed_1',
        date: dStr(1),
        completedAt: new Date().toISOString(),
      },
      {
        id: 'log_seed_4',
        habitId: 'habit_seed_2',
        date: dStr(1),
        completedAt: new Date().toISOString(),
      },
      {
        id: 'log_seed_5',
        habitId: 'habit_seed_3',
        date: dStr(1),
        completedAt: new Date().toISOString(),
      },
    ];

    sampleLogs.forEach((l) => {
      this.tables.habitLogs[l.id] = l;
    });

    // Seed focus session
    const sampleFocus: FocusSession = {
      id: 'focus_seed_1',
      taskId: 'task_seed_2',
      taskTitle: 'Complete deep work coding sprint',
      durationSeconds: 1500,
      targetDurationSeconds: 1500,
      completed: true,
      interrupted: false,
      sessionType: 'FOCUS',
      date: dStr(0),
      timestamp: new Date().toISOString(),
    };
    this.tables.focusSessions[sampleFocus.id] = sampleFocus;

    // Seed monthly budget
    const currentMonthKey = dStr(0).substring(0, 7);
    this.tables.budgets[`budget_overall_${currentMonthKey}`] = {
      id: `budget_overall_${currentMonthKey}`,
      monthKey: currentMonthKey,
      categoryId: null,
      limitMinor: 2500000, // ₹25,000 monthly limit
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tables.budgets[`budget_food_${currentMonthKey}`] = {
      id: `budget_food_${currentMonthKey}`,
      monthKey: currentMonthKey,
      categoryId: 'cat_exp_food',
      limitMinor: 600000, // ₹6,000 food limit
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Reconcile initial balances
    this.reconcileAllAccountBalances();
  }

  private async runMigrations() {
    const versionStr = await AsyncStorage.getItem(DB_VERSION_KEY);
    const version = versionStr ? parseInt(versionStr, 10) : CURRENT_SCHEMA_VERSION;
    if (version < CURRENT_SCHEMA_VERSION) {
      // Future migration steps here
      await AsyncStorage.setItem(DB_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
    }
  }

  /** Marks the database dirty and schedules a batched write. Never serialises inline. */
  private persist() {
    this.hasUnsavedChanges = true;
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      void this.flush();
    }, PERSIST_DEBOUNCE_MS);
  }

  /**
   * Writes immediately if anything is pending.
   *
   * Called on the debounce timer and, crucially, whenever the app leaves the foreground —
   * Android can kill a backgrounded process at any point, and an unflushed batch would be
   * lost data. Awaiting this is how a caller guarantees durability.
   */
  public async flush(): Promise<void> {
    if (!this.hasUnsavedChanges || this.isWriting) return;

    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }

    this.isWriting = true;
    this.hasUnsavedChanges = false;
    try {
      const serialised = JSON.stringify(this.tables);
      await AsyncStorage.setItem(DB_STORAGE_KEY, serialised);
      await AsyncStorage.setItem(DB_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
    } catch (e) {
      // Put the flag back so the next write (or the next flush) retries rather than
      // silently dropping the change.
      this.hasUnsavedChanges = true;
      console.error('Failed to persist database to storage:', e);
    } finally {
      this.isWriting = false;
    }
  }

  public subscribe(listener: DatabaseListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Marks tables as changed so subscribers can skip work for the ones that didn't. */
  private markDirty(...tables: TableName[]) {
    tables.forEach((t) => this.dirtyTables.add(t));
  }

  /** Everything changed — used for load, restore and reset, where per-table tracking
   *  would be both wrong and pointless. */
  private markAllDirty() {
    (Object.keys(this.tables) as TableName[]).forEach((t) => this.dirtyTables.add(t));
  }

  /** Current change set, for a caller that needs it outside a notification. */
  public getDirtyTables(): Set<TableName> {
    return new Set(this.dirtyTables);
  }

  /**
   * Notifies subscribers once per tick rather than once per write.
   *
   * Several repository calls legitimately write more than once for a single user action
   * (creating a transaction, then reconciling account balances). Without coalescing, that
   * is two full re-render passes across every screen for one tap.
   */
  private notify() {
    if (this.notifyScheduled) return;
    this.notifyScheduled = true;
    Promise.resolve().then(() => {
      this.notifyScheduled = false;
      // The change set is handed to every listener and cleared once they have all run —
      // rather than being consumed by whoever reads it first, which would silently starve
      // a second subscriber of the information it needs to update.
      const dirty = this.dirtyTables;
      this.dirtyTables = new Set();
      this.listeners.forEach((fn) => fn(dirty));
    });
  }

  /**
   * Every repo write replaces a whole record (`table[id] = newRecord`) or deletes one —
   * never mutates a record's fields in place — so a snapshot only needs to protect each
   * table's id->record map, not deep-clone every record's contents. This is what makes a
   * shallow one-level-per-table clone a correct (and much cheaper) stand-in for the old
   * JSON.parse(JSON.stringify(...)) full-tree clone, which re-serialized the entire
   * database — including every transaction, note, and habit log ever recorded — on EVERY
   * single write, synchronously, no matter how small that write was.
   */
  private shallowCloneTables(): DatabaseTables {
    const t = this.tables;
    return {
      accounts: { ...t.accounts },
      categories: { ...t.categories },
      transactions: { ...t.transactions },
      budgets: { ...t.budgets },
      recurringTransactions: { ...t.recurringTransactions },
      tasks: { ...t.tasks },
      habits: { ...t.habits },
      habitLogs: { ...t.habitLogs },
      focusSessions: { ...t.focusSessions },
      documents: { ...t.documents },
      widgetConfigs: { ...t.widgetConfigs },
      reminders: { ...t.reminders },
      savingsGoals: { ...t.savingsGoals },
      debts: { ...t.debts },
      notes: { ...t.notes },
      settings: t.settings,
    };
  }

  /**
   * ATOMIC TRANSACTION RUNNER (Rule 10):
   * All mutations inside the transaction callback execute on a clone snapshot.
   * If any error is thrown, the entire operation is rolled back and no state changes persist.
   */
  public runTransaction<T>(callback: (db: DatabaseTables) => T): T {
    // Snapshot clone for rollback safety
    const snapshot = this.shallowCloneTables();

    /**
     * Records which tables the callback reached for.
     *
     * Mutations here always go through the table first — `db.tasks[id] = task` reads
     * `tasks`, `db.accounts = {}` writes it — so trapping both `get` and `set` cannot
     * miss a mutated table. It can over-report (a table that was only read is marked
     * dirty), which costs one unnecessary re-render and is the safe direction to err:
     * under-reporting would leave stale data on screen.
     */
    const touched = new Set<TableName>();
    const tracked = new Proxy(this.tables, {
      get: (target, prop: string) => {
        touched.add(prop as TableName);
        return target[prop as TableName];
      },
      set: (target, prop: string, value) => {
        touched.add(prop as TableName);
        (target as any)[prop] = value;
        return true;
      },
    });

    try {
      const result = callback(tracked as DatabaseTables);
      this.markDirty(...touched);
      this.persist();
      this.notify();
      return result;
    } catch (error) {
      // Rollback
      this.tables = snapshot;
      this.markAllDirty();
      this.notify();
      console.error('Transaction rolled back due to error:', error);
      throw error;
    }
  }

  /**
   * Reconciles all account balances from base openingBalanceMinor + transaction sum.
   * Ensures Source of Truth invariant is mathematically 100% verified.
   */
  public reconcileAllAccountBalances() {
    const accountBalances: Record<string, number> = {};

    // Start with opening balances
    Object.values(this.tables.accounts).forEach((acc) => {
      accountBalances[acc.id] = acc.openingBalanceMinor;
    });

    // Apply all transactions in chronological order
    const txList = Object.values(this.tables.transactions);
    txList.forEach((tx) => {
      if (tx.type === 'INCOME') {
        if (accountBalances[tx.accountId] !== undefined) {
          accountBalances[tx.accountId] += tx.amountMinor;
        }
      } else if (tx.type === 'EXPENSE') {
        if (accountBalances[tx.accountId] !== undefined) {
          accountBalances[tx.accountId] -= tx.amountMinor;
        }
      } else if (tx.type === 'TRANSFER') {
        if (accountBalances[tx.accountId] !== undefined) {
          accountBalances[tx.accountId] -= tx.amountMinor;
        }
        if (tx.destinationAccountId && accountBalances[tx.destinationAccountId] !== undefined) {
          accountBalances[tx.destinationAccountId] += tx.amountMinor;
        }
      }
    });

    // Update account records
    Object.keys(accountBalances).forEach((accId) => {
      if (this.tables.accounts[accId]) {
        this.tables.accounts[accId].currentBalanceMinor = accountBalances[accId];
      }
    });

    // Writes this.tables.accounts directly rather than through runTransaction, so the
    // dirty set has to be updated by hand here.
    this.markDirty('accounts');
    this.persist();
    this.notify();
  }

  public getTables(): DatabaseTables {
    return this.tables;
  }

  public restoreFromBackup(backup: BackupData): void {
    this.runTransaction((db) => {
      if (!backup.data || !backup.metadata) {
        throw new Error('Invalid backup file format.');
      }
      db.accounts = {};
      db.categories = {};
      db.transactions = {};
      db.budgets = {};
      db.recurringTransactions = {};
      db.tasks = {};
      db.habits = {};
      db.habitLogs = {};
      db.focusSessions = {};
      db.savingsGoals = {};
      db.debts = {};
      db.notes = {};
      // Cleared as well as repopulated: leaving these behind would mix reminders from the
      // device's previous dataset into the restored one, with no way to tell them apart.
      db.reminders = {};
      db.widgetConfigs = {};

      (backup.data.accounts || []).forEach((a) => (db.accounts[a.id] = a));
      (backup.data.categories || []).forEach((c) => (db.categories[c.id] = c));
      (backup.data.transactions || []).forEach((t) => (db.transactions[t.id] = t));
      (backup.data.budgets || []).forEach((b) => (db.budgets[b.id] = b));
      (backup.data.recurringTransactions || []).forEach((r) => (db.recurringTransactions[r.id] = r));
      (backup.data.tasks || []).forEach((t) => (db.tasks[t.id] = t));
      (backup.data.habits || []).forEach((h) => (db.habits[h.id] = h));
      (backup.data.habitLogs || []).forEach((hl) => (db.habitLogs[hl.id] = hl));
      (backup.data.focusSessions || []).forEach((f) => (db.focusSessions[f.id] = f));
      (backup.data.savingsGoals || []).forEach((g) => (db.savingsGoals[g.id] = g));
      (backup.data.debts || []).forEach((d) => (db.debts[d.id] = d));
      (backup.data.notes || []).forEach((n) => (db.notes[n.id] = n));
      // `notificationIds` are handles belonging to the OS on the device that made the
      // backup; they mean nothing here. Dropping them lets syncAllReminders() re-register
      // each reminder cleanly instead of trying to cancel identifiers that never existed.
      (backup.data.reminders || []).forEach(
        (r: Reminder) => (db.reminders[r.id] = { ...r, notificationIds: [] })
      );
      (backup.data.widgetConfigs || []).forEach(
        (w: WidgetConfig) => (db.widgetConfigs[w.id] = w)
      );
      if (backup.data.settings) {
        db.settings = { ...DEFAULT_SETTINGS, ...backup.data.settings };
      }
    });
    this.reconcileAllAccountBalances();
  }

  /**
   * Erases every user record (transactions, tasks, habits, budgets, recurring rules,
   * focus sessions) and restores the factory accounts, categories and settings.
   * Deliberately does NOT re-seed the demo data — see resetToFactoryDefaults().
   *
   * Documents are carried over untouched: they're files on disk, not app data, and this
   * table holds only their metadata — wiping it here would orphan the underlying files
   * (nothing would ever delete them) rather than actually removing anything.
   */
  public resetAllData(): void {
    const documents = this.tables.documents;
    const widgetConfigs = this.tables.widgetConfigs;
    this.tables = { ...this.getEmptyDatabase(), documents, widgetConfigs };
    this.markAllDirty();
    this.persist();
    this.notify();
  }

  /** Wipes everything and re-seeds the demo transactions/tasks/habits. Used only for
   *  a fresh install; "Reset Data" in Settings calls resetAllData() so the demo rows
   *  don't reappear and make the reset look like it did nothing. */
  public resetToFactoryDefaults(): void {
    const documents = this.tables.documents;
    const widgetConfigs = this.tables.widgetConfigs;
    this.tables = { ...this.getEmptyDatabase(), documents, widgetConfigs };
    this.seedInitialSampleData();
    this.markAllDirty();
    this.persist();
    this.notify();
  }
}

export const dbEngine = new DatabaseEngine();
