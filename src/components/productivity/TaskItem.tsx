import React from 'react';
import { Task } from '../../types';
import { taskRepository } from '../../database/repositories/taskRepo';
import { formatDateDisplay, formatTimeDisplay } from '../../utils/date';
import { Check, Clock, AlertCircle, Calendar, Play } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { audioService } from '../../services/audioService';
import { cn } from '../../utils/cn';

interface TaskItemProps {
  task: Task;
  onClick: () => void;
  onStartFocus?: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onClick, onStartFocus }) => {
  const isCompleted = task.status === 'COMPLETED';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    taskRepository.toggleComplete(task.id);
    if (!isCompleted) {
      audioService.playSuccessTone();
      audioService.triggerHaptic('success');
    } else {
      audioService.triggerHaptic('light');
    }
  };

  const priorityBadgeVariant = {
    LOW: 'default',
    MEDIUM: 'info',
    HIGH: 'warning',
    URGENT: 'danger',
  } as const;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none group',
        isCompleted
          ? 'bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-800/50 opacity-60'
          : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'
      )}
      id={`task_${task.id}`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Checkbox button */}
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition-colors cursor-pointer',
            isCompleted
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-500 text-transparent'
          )}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        {/* Title & Metadata */}
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              'text-xs font-semibold transition-all',
              isCompleted
                ? 'line-through text-zinc-400 dark:text-zinc-500'
                : 'text-zinc-900 dark:text-zinc-100'
            )}
          >
            {task.title}
          </span>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex-wrap">
            {task.dueDate && (
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3 h-3 text-zinc-400" />
                {formatDateDisplay(task.dueDate)}
                {task.dueTime && ` • ${formatTimeDisplay(task.dueTime)}`}
              </span>
            )}

            {task.priority !== 'MEDIUM' && (
              <Badge size="sm" variant={priorityBadgeVariant[task.priority]}>
                {task.priority}
              </Badge>
            )}

            {task.tags && task.tags.length > 0 && (
              <span className="text-[10px] text-zinc-400">#{task.tags[0]}</span>
            )}
          </div>
        </div>
      </div>

      {/* Focus Link Trigger */}
      {onStartFocus && !isCompleted && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStartFocus(task);
          }}
          className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors ml-2 shrink-0"
          title="Start focus timer on this task"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>
      )}
    </div>
  );
};
