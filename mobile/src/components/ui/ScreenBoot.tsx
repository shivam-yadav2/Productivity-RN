import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useDatabase } from '../../context/DatabaseContext';

interface ScreenBootProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shows `fallback` (a screen skeleton) until the screen's real content can be mounted.
 *
 * Two things gate it:
 *  1. `isReady` — on a cold start the database is still being read out of AsyncStorage,
 *     so screens would otherwise render against empty tables and visibly re-populate.
 *  2. A one-frame deferral — mounting a screen's real subtree is synchronous and blocks
 *     the JS thread (computing balances, grouping transactions, laying out lists). Done
 *     in the same frame the tab becomes visible, the skeleton never gets a chance to
 *     paint and you just see the old screen freeze, which is exactly the "content shows
 *     a bit later" gap. Deferring past one animation frame lets the skeleton paint first,
 *     so the wait is visible and intentional instead of looking like a hang.
 */
export const ScreenBoot: React.FC<ScreenBootProps> = ({ fallback, children }) => {
  const { isReady } = useDatabase();
  const [deferred, setDeferred] = useState(false);

  useEffect(() => {
    let raf2 = 0;
    // Two frames: the first schedules after the current render commits, the second runs
    // once the skeleton has actually been painted.
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setDeferred(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, []);

  if (!isReady || !deferred) {
    return <View style={{ flex: 1 }}>{fallback}</View>;
  }

  return <>{children}</>;
};
