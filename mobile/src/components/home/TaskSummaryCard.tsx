import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { Task } from '../../types';
import { taskRepository } from '../../database/repositories/taskRepo';
import { formatTimeDisplay } from '../../utils/date';
import { audioService } from '../../services/audioService';
import { accent } from '../../utils/theme';
import { PressableScale } from '../ui/PressableScale';

interface TaskSummaryCardProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onNavigateToProductivity: () => void;
}

function titleCasePriority(priority: Task['priority']) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

/**
 * Tall orange "your day" tile — featured/next-up task with a one-tap complete toggle.
 * Stretches to match the height of the habit + quick-action tiles stacked beside it
 * (flex row default cross-axis stretch), the RN equivalent of the reference's
 * `grid-row: span 2`.
 */
export const TaskSummaryCard: React.FC<TaskSummaryCardProps> = ({
  tasks,
  onSelectTask,
  onNavigateToProductivity,
}) => {
  const pendingCount = tasks.filter((t) => t.status !== 'COMPLETED').length;
  const featured = tasks.find((t) => t.status !== 'COMPLETED') ?? tasks[0];

  const handleToggleFeatured = () => {
    if (!featured) return;
    const wasCompleted = featured.status === 'COMPLETED';
    taskRepository.toggleComplete(featured.id);
    if (!wasCompleted) {
      audioService.playSuccessTone();
      audioService.triggerHaptic('success');
    } else {
      audioService.triggerHaptic('light');
    }
  };

  const subtitle = featured
    ? [
        featured.dueTime ? formatTimeDisplay(featured.dueTime) : null,
        featured.priority !== 'MEDIUM' ? `${titleCasePriority(featured.priority)} priority` : null,
      ]
        .filter(Boolean)
        .join(' · ') || 'No due time set'
    : 'Add a task to get moving';

  return (
    <PressableScale
      onPress={() => (featured ? onSelectTask(featured) : onNavigateToProductivity())}
      activeScale={0.98}
      dim={false}
      style={{ flex: 1 }}
      className="flex-1 rounded-[24px] bg-accentOrange-bg p-[18px] justify-between"
    >
      <View>
        <View className="self-start px-2.5 py-1 rounded-full bg-accentOrange">
          <Text className="text-[10.5px] font-bold text-accentOrange-deep">
            {featured ? `${pendingCount} due today` : 'All clear'}
          </Text>
        </View>

        <Text numberOfLines={3} className="font-jakarta text-[17px] text-accentOrange-deep mt-3 leading-[21px]">
          {featured ? featured.title : "You're all caught up"}
        </Text>

        <Text className="text-xs text-accentOrange-deep opacity-70 mt-1.5">{subtitle}</Text>
      </View>

      {featured && (
        <Pressable onPress={handleToggleFeatured} hitSlop={6} className="flex-row items-center gap-2 mt-3">
          <View className="w-[30px] h-[30px] rounded-[10px] bg-accentOrange-deep items-center justify-center">
            <Check size={15} color={accent.orange.bg} strokeWidth={2.3} />
          </View>
          <Text className="text-xs font-semibold text-accentOrange-deep">
            {featured.status === 'COMPLETED' ? 'Marked complete' : 'Mark complete'}
          </Text>
        </Pressable>
      )}
    </PressableScale>
  );
};
