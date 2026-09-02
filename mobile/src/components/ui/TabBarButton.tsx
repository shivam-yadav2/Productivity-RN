import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { spring, timing, useReducedMotion } from '../../utils/motion';
import { inkText, surface } from '../../utils/theme';
import { audioService } from '../../services/audioService';

type IconType = React.ComponentType<{ size?: number; color?: string }>;

interface TabBarButtonProps {
  label: string;
  icon: IconType;
  active: boolean;
  isDark: boolean;
  onPress: () => void;
}

const SIZE = 46;

/**
 * A floating-pill nav item: the active tab gets a soft circle springing in behind its
 * icon instead of a label swap — no text, matching the reference nav. The pill itself
 * (see App.tsx) is always dark in either app theme, so the circle only ever needs to
 * contrast against that one background, not both.
 */
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

  const circleStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  const activeIconColor = inkText(isDark);
  const idleIconColor = '#8E8B96';

  return (
    <Pressable
      // Fired on touch-down rather than bundled into onPress, so the tick is felt the
      // instant a finger lands — not after `onPress` also runs the tab switch + whatever
      // that newly-shown screen's first mount costs, which is what made this feel delayed.
      onPressIn={() => {
        if (active) return;
        audioService.playSoftClick();
        audioService.triggerHaptic('light');
      }}
      onPress={onPress}
      style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            backgroundColor: isDark ? surface.dark : surface.light,
          },
          circleStyle,
        ]}
      />
      <Icon size={19} color={active ? activeIconColor : idleIconColor} />
    </Pressable>
  );
};
