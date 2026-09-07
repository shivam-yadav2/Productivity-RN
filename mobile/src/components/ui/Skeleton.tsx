import React, { useEffect } from 'react';
import { View, ViewStyle, useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../utils/motion';
import { ink } from '../../utils/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * A single placeholder block that breathes while real content is being prepared.
 *
 * Reanimated's animated style and NativeWind's `className` can't share one element
 * (see src/utils/nativewindInterop.ts), so this takes plain `style` props only and
 * resolves its own colours from the system scheme rather than `dark:` classes.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 14,
  borderRadius = 8,
  style,
}) => {
  const isDark = useColorScheme() === 'dark';
  const reduced = useReducedMotion();
  const pulse = useSharedValue(reduced ? 0.55 : 0.35);

  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(
      withTiming(0.75, { duration: 780, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [reduced, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? ink[800] : ink[200],
        },
        style,
        animatedStyle,
      ]}
    />
  );
};

/** A card-shaped placeholder — the building block most screen skeletons are made of. */
export const SkeletonCard: React.FC<{ height?: number; style?: ViewStyle }> = ({
  height = 96,
  style,
}) => <Skeleton height={height} borderRadius={24} style={style} />;

/** A row placeholder: circular icon well + two stacked text lines. */
export const SkeletonRow: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>
    <Skeleton width={40} height={40} borderRadius={14} />
    <View style={{ flex: 1, gap: 7 }}>
      <Skeleton width="62%" height={12} />
      <Skeleton width="38%" height={10} />
    </View>
    <Skeleton width={54} height={14} />
  </View>
);
