import { dbEngine } from '../db';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { getTodayDateString } from '../../utils/date';

export const taskRepository = {
  getAll(): Task[] {
    const db = dbEngine.getTables();
    return Object.values(db.tasks).sort((a, b) => {
      // Completed at bottom
      if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
      if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;

      // Priority ordering: URGENT > HIGH > MEDIUM > LOW
      const pOrder: Record<TaskPriority, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const diffP = (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      if (diffP !== 0) return diffP;

      // Due date ordering
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  },

  getById(id: string): Task | undefined {
    return dbEngine.getTables().tasks[id];
  },

  /**
   * Fast capture helper: "Capture first. Organize later."
   */
  create(params: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    dueTime?: string;
    tags?: string[];
    reminderTime?: string;
    linkedAccountId?: string;
    estimatedMinutes?: number;
  }): Task {
    if (!params.title.trim()) {
      throw new Error('Task title cannot be empty.');
    }

    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const task: Task = {
      id,
      title: params.title.trim(),
      description: params.description?.trim(),
      status: params.status || 'TODO',
      priority: params.priority || 'MEDIUM',
      dueDate: params.dueDate || getTodayDateString(),
      dueTime: params.dueTime,
      tags: params.tags && params.tags.length > 0 ? params.tags : undefined,
      reminderTime: params.reminderTime,
      linkedAccountId: params.linkedAccountId,
      estimatedMinutes: params.estimatedMinutes,
      createdAt: now,
      updatedAt: now,
      completedAt: params.status === 'COMPLETED' ? now : undefined,
    };

    dbEngine.runTransaction((db) => {
      db.tasks[id] = task;
    });

    return task;
  },

  update(id: string, params: Partial<Omit<Task, 'id' | 'createdAt'>>): Task {
    const existing = dbEngine.getTables().tasks[id];
    if (!existing) {
      throw new Error(`Task ${id} not found.`);
    }

    const now = new Date().toISOString();
    let completedAt = existing.completedAt;

    if (params.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      completedAt = now;
    } else if (params.status && params.status !== 'COMPLETED') {
      completedAt = undefined;
    }

    const updated: Task = {
      ...existing,
      ...params,
      completedAt,
      updatedAt: now,
    };

    dbEngine.runTransaction((db) => {
      db.tasks[id] = updated;
    });

    return updated;
  },

  toggleComplete(id: string): Task {
    const existing = dbEngine.getTables().tasks[id];
    if (!existing) {
      throw new Error(`Task ${id} not found.`);
    }

    const newStatus: TaskStatus = existing.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    return this.update(id, { status: newStatus });
  },

  delete(id: string): void {
    dbEngine.runTransaction((db) => {
      delete db.tasks[id];
    });
  },
};
