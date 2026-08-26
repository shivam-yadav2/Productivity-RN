import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Task } from '../../types';
import { taskRepository } from '../../database/repositories/taskRepo';
import { formatDateDisplay, formatTimeDisplay } from '../../utils/date';
import { Check, Calendar, Play } from 'lucide-react-native';
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

  const handleToggle = () => {
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
    <Pressable
      onPress={onClick}
      className={cn(
        'flex-row items-center justify-between p-3 rounded-xl border',
        isCompleted
          ? 'bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-800/50 opacity-60'
          : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80'
      )}
    >
      <View className="flex-row items-start gap-3 min-w-0 flex-1">
        <Pressable
          onPress={handleToggle}
          className={cn(
            'w-5 h-5 rounded-lg border items-center justify-center mt-0.5 shrink-0',
            isCompleted ? 'bg-emerald-600 border-emerald-600' : 'border-zinc-300 dark:border-zinc-600'
          )}
          accessibilityLabel={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {isCompleted && <Check size={14} color="#fff" strokeWidth={3} />}
        </Pressable>

        <View className="flex flex-col min-w-0 flex-1">
          <Text
            className={cn(
              'text-xs font-semibold',
              isCompleted
                ? 'line-through text-zinc-400 dark:text-zinc-500'
                : 'text-zinc-900 dark:text-zinc-100'
            )}
          >
            {task.title}
          </Text>

          <View className="flex-row items-center gap-2 mt-1 flex-wrap">
            {task.dueDate && (
              <View className="flex-row items-center gap-1">
                <Calendar size={12} color="#a1a1aa" />
                <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {formatDateDisplay(task.dueDate)}
                  {task.dueTime && ` • ${formatTimeDisplay(task.dueTime)}`}
                </Text>
              </View>
            )}

            {task.priority !== 'MEDIUM' && (
              <Badge size="sm" variant={priorityBadgeVariant[task.priority]}>
                {task.priority}
              </Badge>
            )}

            {task.tags && task.tags.length > 0 && (
              <Text className="text-[10px] text-zinc-400">#{task.tags[0]}</Text>
            )}
          </View>
        </View>
      </View>

      {onStartFocus && !isCompleted && (
        <Pressable
          onPress={() => onStartFocus(task)}
          className="p-2 rounded-lg ml-2 shrink-0 active:bg-blue-50 dark:active:bg-blue-950/40"
          accessibilityLabel="Start focus timer on this task"
        >
          <Play size={16} color="#a1a1aa" fill="#a1a1aa" />
        </Pressable>
      )}
    </Pressable>
  );
};
