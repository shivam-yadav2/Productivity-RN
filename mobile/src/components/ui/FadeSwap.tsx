import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  FadeOut,
  withTiming,
  type EntryExitAnimationFunction,
} from 'react-native-reanimated';
import { timing, useReducedMotion } from '../../utils/motion';

interface FadeSwapProps {
  /** Change this to trigger the transition. */
  swapKey: string | number;
  children: React.ReactNode;
  /** Classes for the wrapper (a plain View, so Tailwind applies normally). */
  className?: string;
  /** Stretch to fill the parent (use when the child is a ScrollView). Default false. */
  fill?: boolean;
}

const enter: EntryExitAnimationFunction = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 8 }, { scale: 0.985 }] },
    animations: {
      opacity: withTiming(1, timing.base),
      transform: [
        { translateY: withTiming(0, timing.base) },
        { scale: withTiming(1, timing.base) },
      ],
    },
  };
};

/**
 * Cross-fades between successive children as `swapKey` changes — the quiet content
 * transition iOS uses when swapping tabs or panels. Slides up a few points and settles
 * from 98.5% scale so it reads as arriving, not just blinking.
 */
export const FadeSwap: React.FC<FadeSwapProps> = ({ swapKey, children, className, fill = false }) => {
  const reduced = useReducedMotion();
  const fillStyle = fill ? styles.fill : undefined;

  if (reduced) {
    return (
      <View className={className} style={fillStyle}>
        {children}
      </View>
    );
  }

  return (
    <View className={className} style={fillStyle}>
      <Animated.View
        key={swapKey}
        entering={enter}
        exiting={FadeOut.duration(timing.fast.duration)}
        style={fillStyle}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
