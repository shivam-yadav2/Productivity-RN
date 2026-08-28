import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { ReduceMotion, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/**
 * iOS-flavoured motion tokens. Springs are tuned to feel like UIKit: a quick,
 * lightly-damped settle for taps and a softer, heavier settle for surfaces
 * (sheets, cards) that carry more visual weight.
 */
export const spring = {
  /** Snappy — buttons, toggles, small controls. */
  snappy: { damping: 20, stiffness: 260, mass: 0.8 } satisfies WithSpringConfig,
  /** Standard UI — segmented thumbs, chips, icon bounces. */
  ui: { damping: 18, stiffness: 200, mass: 0.9 } satisfies WithSpringConfig,
  /** Surfaces — bottom sheets, modals, large panels. */
  surface: { damping: 22, stiffness: 180, mass: 1 } satisfies WithSpringConfig,
  /** Playful overshoot — checkmarks, success pops. */
  pop: { damping: 12, stiffness: 320, mass: 0.7 } satisfies WithSpringConfig,
} as const;

export const timing = {
  fast: { duration: 160 } satisfies WithTimingConfig,
  base: { duration: 240 } satisfies WithTimingConfig,
  slow: { duration: 380 } satisfies WithTimingConfig,
} as const;

/** Honour the OS "Reduce Motion" accessibility switch. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduced(v));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}

/** Pass to Reanimated layout/entering animations so they respect Reduce Motion. */
export const reduceMotionPref = ReduceMotion.System;
