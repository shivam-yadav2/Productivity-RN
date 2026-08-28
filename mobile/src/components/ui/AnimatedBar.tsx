import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { timing, useReducedMotion } from '../../utils/motion';
import { cn } from '../../utils/cn';

interface AnimatedBarProps {
  /** Target fill, 0–100. */
  percent: number;
  /** Track className (height, bg, rounding) — the track is a plain View. */
  trackClassName?: string;
  /** Fill colour. The fill is an animated element, so it takes a colour, not a class. */
  fillColor: string;
  /** Corner radius on the fill. Default 999 (pill). */
  fillRadius?: number;
  /** Stagger start, ms. */
  delay?: number;
  /** Override the ease duration, ms. Default 380. */
  durationMs?: number;
}

/** Horizontal progress fill that eases to its target width instead of snapping. */
export const AnimatedBar: React.FC<AnimatedBarProps> = ({
  percent,
  trackClassName,
  fillColor,
  fillRadius = 999,
  delay = 0,
  durationMs,
}) => {
  const reduced = useReducedMotion();
  const width = useSharedValue(reduced ? clamp(percent) : 0);

  useEffect(() => {
    const target = clamp(percent);
    const cfg = durationMs != null ? { duration: durationMs } : timing.slow;
    width.value = reduced ? target : withDelay(delay, withTiming(target, cfg));
  }, [percent, reduced, delay, durationMs, width]);

  const style = useAnimatedStyle(() => ({ width: `${width.value}%` as ViewStyle['width'] }));

  return (
    <View className={cn('w-full overflow-hidden', trackClassName)}>
      <Animated.View
        style={[{ height: '100%', backgroundColor: fillColor, borderRadius: fillRadius }, style]}
      />
    </View>
  );
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}
