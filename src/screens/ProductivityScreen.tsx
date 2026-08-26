import React, { useState, useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Task, Habit, TaskStatus } from '../types';
import { taskRepository } from '../database/repositories/taskRepo';
import { TaskItem } from '../components/productivity/TaskItem';
import { TaskQuickAdd } from '../components/productivity/TaskQuickAdd';
import { HabitCard } from '../components/productivity/HabitCard';
import { FocusTimer } from '../components/productivity/FocusTimer';
import { FocusAnalytics } from '../components/productivity/FocusAnalytics';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  CheckSquare,
  Sparkles,
  Timer,
  Plus,
  Filter,
  Flame,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface ProductivityScreenProps {
  onSelectTask: (task: Task) => void;
  onOpenNewTask: () => void;
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  initialFocusTask?: Task | null;
}

export const ProductivityScreen: React.FC<ProductivityScreenProps> = ({
  onSelectTask,
  onOpenNewTask,
  onOpenNewHabit,
  onEditHabit,
  initialFocusTask,
}) => {
  const { db } = useDatabase();
  const [activeTab, setActiveTab] = useState<'TASKS' | 'HABITS' | 'FOCUS'>('TASKS');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'TODAY' | 'HIGH' | 'COMPLETED'>('ALL');
  const [focusTask, setFocusTask] = useState<Task | null>(initialFocusTask || null);

  const tasks = Object.values(db.tasks);
  const habits = Object.values(db.habits);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (taskFilter === 'COMPLETED') return t.status === 'COMPLETED';
        if (t.status === 'COMPLETED' && taskFilter !== 'ALL') return false;

        if (taskFilter === 'TODAY') {
          const todayStr = new Date().toISOString().split('T')[0];
          return t.dueDate === todayStr;
        }
        if (taskFilter === 'HIGH') {
          return t.priority === 'HIGH' || t.priority === 'URGENT';
        }
        return true;
      })
      .sort((a, b) => {
        if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
        if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
        return (b.dueDate || '').localeCompare(a.dueDate || '');
      });
  }, [tasks, taskFilter]);

  const handleStartFocus = (task: Task) => {
    setFocusTask(task);
    setActiveTab('FOCUS');
  };

  return (
    <div className="flex flex-col gap-4 pb-14">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Productivity
          </h1>
          <span className="text-xs text-zinc-500">Tasks, daily habits & deep focus timers</span>
        </div>

        {activeTab === 'TASKS' && (
          <Button size="sm" onClick={onOpenNewTask}>
            <Plus className="w-4 h-4 mr-1" /> New Task
          </Button>
        )}

        {activeTab === 'HABITS' && (
          <Button size="sm" onClick={onOpenNewHabit}>
            <Plus className="w-4 h-4 mr-1" /> New Habit
          </Button>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/70 rounded-2xl">
        <button
          onClick={() => setActiveTab('TASKS')}
          className={cn(
            'flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
            activeTab === 'TASKS'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          )}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Tasks ({tasks.filter((t) => t.status !== 'COMPLETED').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HABITS')}
          className={cn(
            'flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
            activeTab === 'HABITS'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Habits ({habits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FOCUS')}
          className={cn(
            'flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
            activeTab === 'FOCUS'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          )}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Focus</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'TASKS' && (
        <div className="flex flex-col gap-3">
          {/* Quick Capture Input */}
          <TaskQuickAdd />

          {/* Task Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { key: 'ALL', label: 'All Tasks' },
              { key: 'TODAY', label: 'Due Today' },
              { key: 'HIGH', label: 'Priority' },
              { key: 'COMPLETED', label: 'Completed' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setTaskFilter(f.key as any)}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-lg shrink-0 transition-all',
                  taskFilter === f.key
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Tasks List */}
          <div className="flex flex-col gap-2">
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-zinc-400 mb-2" />
                <span>No tasks in this filter view.</span>
              </div>
            ) : (
              filteredTasks.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onClick={() => onSelectTask(t)}
                  onStartFocus={() => handleStartFocus(t)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'HABITS' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500">
            Build consistency with daily habits. Tap once to mark complete for today.
          </p>

          <div className="flex flex-col gap-2.5">
            {habits.length === 0 ? (
              <div className="py-12 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 flex flex-col items-center justify-center">
                <Sparkles className="w-8 h-8 text-zinc-400 mb-2" />
                <span>No habits created yet.</span>
                <Button size="sm" className="mt-3" onClick={onOpenNewHabit}>
                  <Plus className="w-4 h-4 mr-1" /> Add Your First Habit
                </Button>
              </div>
            ) : (
              habits.map((h) => <HabitCard key={h.id} habit={h} onEdit={onEditHabit} />)
            )}
          </div>
        </div>
      )}

      {activeTab === 'FOCUS' && (
        <div className="flex flex-col gap-4">
          <FocusTimer initialTask={focusTask} />
          <FocusAnalytics />
        </div>
      )}
    </div>
  );
};
