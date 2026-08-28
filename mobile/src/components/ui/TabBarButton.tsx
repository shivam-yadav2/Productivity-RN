import React, { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { spring, timing, useReducedMotion } from '../../utils/motion';
import { cn } from '../../utils/cn';

type IconType = React.ComponentType<{ size?: number; color?: string }>;

interface TabBarButtonProps {
  label: string;
  icon: IconType;
  active: boolean;
  isDark: boolean;
  onPress: () => void;
}

/** A bottom-tab item whose icon springs up when it becomes active. */
export const TabBarButton: React.FC<TabBarButtonProps> = ({ label, icon: Icon, active, isDark, onPress }) => {
  const reduced = useReducedMotion();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = reduced
      ? active
        ? 1
        : 0
      : active
        ? withSpring(1, spring.pop)
        : withTiming(0, timing.base);
  }, [active, reduced, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.16 }, { translateY: -progress.value * 2 }],
  }));

  const activeColor = isDark ? '#f4f4f5' : '#18181b';
  const inactiveColor = '#a1a1aa';

  return (
    <Pressable
      onPress={onPress}
      className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl"
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={iconStyle}>
        <Icon size={20} color={active ? activeColor : inactiveColor} />
      </Animated.View>
      <Text
        className={cn(
          'text-[10px]',
          active ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
};
