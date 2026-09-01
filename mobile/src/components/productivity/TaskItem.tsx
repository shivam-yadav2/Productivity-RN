import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Task } from '../../types';
import { taskRepository } from '../../database/repositories/taskRepo';
import { formatDateDisplay, formatTimeDisplay } from '../../utils/date';
import { Check, Calendar, Play } from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { PressableScale } from '../ui/PressableScale';
import { listItemEntering, listItemExiting, listItemLayout } from '../ui/listMotion';
import { spring, useReducedMotion } from '../../utils/motion';
import { audioService } from '../../services/audioService';
import { cn } from '../../utils/cn';

interface TaskItemProps {
  task: Task;
  onClick: () => void;
  onStartFocus?: (task: Task) => void;
  index?: number;
}

export const TaskItem: React.FC<TaskItemProps> = React.memo(({ task, onClick, onStartFocus, index = 0 }) => {
  const isCompleted = task.status === 'COMPLETED';
  const reduced = useReducedMotion();

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
    <Animated.View
      entering={reduced ? undefined : listItemEntering(index)}
      exiting={reduced ? undefined : listItemExiting}
      layout={reduced ? undefined : listItemLayout}
    >
    <PressableScale
      onPress={onClick}
      activeScale={0.99}
      dim={false}
      className={cn(
        'flex-row items-center justify-between p-3 rounded-xl border',
        isCompleted
          ? 'bg-ink-50/60 dark:bg-ink-900/40 border-ink-200/50 dark:border-ink-800/50 opacity-60'
          : 'bg-white dark:bg-ink-900 border-ink-200/80 dark:border-ink-800/80'
      )}
    >
      <View className="flex-row items-start gap-3 min-w-0 flex-1">
        <Pressable
          onPress={handleToggle}
          hitSlop={8}
          className={cn(
            'w-5 h-5 rounded-lg border items-center justify-center mt-0.5 shrink-0',
            isCompleted ? 'bg-emerald-600 border-emerald-600' : 'border-ink-300 dark:border-ink-600'
          )}
          accessibilityLabel={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {isCompleted && (
            <Animated.View entering={reduced ? undefined : ZoomIn.springify().damping(spring.pop.damping).stiffness(spring.pop.stiffness)}>
              <Check size={14} color="#fff" strokeWidth={3} />
            </Animated.View>
          )}
        </Pressable>

        <View className="flex flex-col min-w-0 flex-1">
          <Text
            className={cn(
              'text-xs font-semibold',
              isCompleted
                ? 'line-through text-ink-400 dark:text-ink-500'
                : 'text-ink-900 dark:text-ink-100'
            )}
          >
            {task.title}
          </Text>

          <View className="flex-row items-center gap-2 mt-1 flex-wrap">
            {task.dueDate && (
              <View className="flex-row items-center gap-1">
                <Calendar size={12} color="#A79D8C" />
                <Text className="text-[11px] font-medium text-ink-500 dark:text-ink-400">
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
              <Text className="text-[10px] text-ink-400">#{task.tags[0]}</Text>
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
          <Play size={16} color="#A79D8C" fill="#A79D8C" />
        </Pressable>
      )}
    </PressableScale>
    </Animated.View>
  );
});

TaskItem.displayName = 'TaskItem';
