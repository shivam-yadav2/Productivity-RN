import React, { useCallback } from 'react';
import { Pressable, PressableProps, GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { spring, timing, useReducedMotion } from '../../utils/motion';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** How far to scale down while pressed. Default 0.96. */
  activeScale?: number;
  /** Dim slightly while pressed. Default true. */
  dim?: boolean;
  /** Fire a light haptic on press-in. Default false. */
  haptic?: boolean;
  /** Layout style — applied to the animated wrapper, so it is the flex item. */
  style?: StyleProp<ViewStyle>;
  /** Tailwind classes — applied to the inner Pressable. */
  className?: string;
  children?: React.ReactNode;
}

/**
 * Pressable that springs its scale down on press and back on release — the tactile
 * feedback iOS gives every control. Runs on the UI thread via Reanimated.
 *
 * The animated transform lives on an outer `Animated.View` and `className` on an inner
 * `Pressable`, because a Reanimated style and NativeWind's `className` cannot share one
 * element (see src/utils/nativewindInterop.ts). Consumer `style` goes on the wrapper so
 * flex/width sizing still applies to the outermost element.
 */
export const PressableScale = React.forwardRef<React.ComponentRef<typeof Pressable>, PressableScaleProps>(
  (
    { activeScale = 0.96, dim = true, haptic = false, onPressIn, onPressOut, style, className, children, ...props },
    ref
  ) => {
    const reduced = useReducedMotion();
    const pressed = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: reduced ? 1 : 1 - pressed.value * (1 - activeScale) }],
      opacity: dim ? 1 - pressed.value * 0.12 : 1,
    }));

    const handlePressIn = useCallback(
      (e: GestureResponderEvent) => {
        pressed.value = reduced ? 0 : withSpring(1, spring.snappy);
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPressIn?.(e);
      },
      [haptic, onPressIn, pressed, reduced]
    );

    const handlePressOut = useCallback(
      (e: GestureResponderEvent) => {
        pressed.value = withTiming(0, timing.fast);
        onPressOut?.(e);
      },
      [onPressOut, pressed]
    );

    return (
      <Animated.View style={[animatedStyle, style]}>
        <Pressable
          ref={ref}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className={className}
          {...props}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }
);

PressableScale.displayName = 'PressableScale';
