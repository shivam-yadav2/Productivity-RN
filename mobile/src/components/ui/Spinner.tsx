import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../utils/motion';

interface SpinnerProps {
  size?: number;
  color?: string;
  /** Track color behind the spinning arc. Defaults to a faint version of `color`. */
  trackColor?: string;
  thickness?: number;
}

/**
 * A continuously rotating ring — for "this is happening right now" feedback (a save,
 * an import, a picker awaiting a result), as opposed to a one-shot entrance animation.
 * Falls back to a static ring under Reduce Motion instead of spinning forever.
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 20,
  color = '#18161D',
  trackColor = '#e4e4e7',
  thickness = 2.5,
}) => {
  const reduced = useReducedMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    rotation.value = withRepeat(withTiming(360, { duration: 800, easing: Easing.linear }), -1, false);
  }, [reduced, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: thickness,
        borderColor: trackColor,
      }}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: thickness,
            borderColor: 'transparent',
            borderTopColor: color,
            position: 'absolute',
            top: -thickness,
            left: -thickness,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};
