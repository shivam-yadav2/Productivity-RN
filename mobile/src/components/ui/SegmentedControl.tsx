import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { audioService } from '../../services/audioService';
import { spring, useReducedMotion } from '../../utils/motion';
import { cn } from '../../utils/cn';
import { ink, inkText, surface } from '../../utils/theme';

type IconType = React.ComponentType<{ size?: number; color?: string }>;

export interface Segment<T extends string> {
  key: T;
  label: string;
  icon?: IconType;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Visual density. */
  size?: 'sm' | 'md';
  className?: string;
}

const PADDING = 4;

/** iOS-style segmented control: the selected "thumb" springs across to the tapped segment. */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const isDark = useColorScheme() === 'dark';
  const reduced = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);

  const count = segments.length;
  const segWidth = trackWidth > 0 ? (trackWidth - PADDING * 2) / count : 0;
  const activeIndex = Math.max(0, segments.findIndex((s) => s.key === value));

  const translateX = useSharedValue(0);

  useEffect(() => {
    const target = activeIndex * segWidth;
    translateX.value = reduced ? target : withSpring(target, spring.ui);
  }, [activeIndex, segWidth, reduced, translateX]);

  // Reanimated style and NativeWind className can't share an element, so the thumb's
  // colours are inline (see src/utils/nativewindInterop.ts).
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segWidth,
  }));

  const activeText = inkText(isDark);
  const mutedText = ink[500];
  const py = size === 'sm' ? 'py-1.5' : 'py-2';

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
      className={cn('flex-row items-center rounded-2xl bg-ink-100 dark:bg-ink-800/70', className)}
      style={{ padding: PADDING }}
    >
      {segWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: PADDING,
              bottom: PADDING,
              left: PADDING,
              borderRadius: 12,
              backgroundColor: isDark ? ink[900] : surface.light,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            },
            thumbStyle,
          ]}
        />
      )}

      {segments.map((seg) => {
        const isActive = seg.key === value;
        const Icon = seg.icon;
        return (
          <Pressable
            key={seg.key}
            onPress={() => {
              if (seg.key === value) return;
              audioService.playSoftClick();
              audioService.triggerHaptic('light');
              onChange(seg.key);
            }}
            className={cn('flex-1 flex-row items-center justify-center gap-1.5 rounded-xl', py)}
          >
            {Icon && <Icon size={14} color={isActive ? activeText : mutedText} />}
            <Text
              numberOfLines={1}
              className={cn(
                'text-xs font-bold',
                isActive ? 'text-ink-900 dark:text-ink-100' : 'text-ink-500'
              )}
            >
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
