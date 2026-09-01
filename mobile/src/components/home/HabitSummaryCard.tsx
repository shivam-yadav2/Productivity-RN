import React from 'react';
import { View, Text } from 'react-native';
import { Habit } from '../../types';
import { habitRepository } from '../../database/repositories/habitRepo';
import { PressableScale } from '../ui/PressableScale';

interface HabitSummaryCardProps {
  habits: Habit[];
  doneToday: number;
  onPress: (habit: Habit) => void;
  onNavigateToProductivity: () => void;
}

/** Flat blue "your day" tile — featured habit with today's completion count and streak. */
export const HabitSummaryCard: React.FC<HabitSummaryCardProps> = ({
  habits,
  doneToday,
  onPress,
  onNavigateToProductivity,
}) => {
  const featured = habits[0];
  const streak = featured ? habitRepository.getStats(featured.id).currentStreak : 0;

  return (
    <PressableScale
      onPress={() => (featured ? onPress(featured) : onNavigateToProductivity())}
      activeScale={0.98}
      dim={false}
      className="rounded-[24px] bg-accentBlue-bg p-4"
    >
      <View className="self-start px-2.5 py-1 rounded-full bg-accentBlue">
        <Text className="text-[10.5px] font-bold text-accentBlue-deep">
          {habits.length > 0 ? `${doneToday}/${habits.length} done` : 'No habits'}
        </Text>
      </View>

      <Text numberOfLines={1} className="font-jakarta text-[15px] text-accentBlue-deep mt-2.5">
        {featured ? featured.name : 'Add a habit'}
      </Text>

      <Text className="text-[11.5px] text-accentBlue-deep opacity-70 mt-0.5">
        {featured ? `\u{1F525} ${streak}-day streak` : 'Build momentum daily'}
      </Text>
    </PressableScale>
  );
};
