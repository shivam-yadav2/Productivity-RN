import React, { useEffect, useRef, useState } from 'react';
import { Text, TextProps } from 'react-native';
import { formatCurrency } from '../../utils/currency';
import { useReducedMotion } from '../../utils/motion';

interface AnimatedCurrencyProps extends TextProps {
  valueMinor: number;
  currency?: string;
  options?: { showSymbol?: boolean; showDecimals?: boolean; compact?: boolean };
  /** Tween length, ms. Default 600. */
  durationMs?: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Currency text that rolls from its previous value to the new one instead of
 * snapping — the little flourish iOS gives balances and totals.
 */
export const AnimatedCurrency: React.FC<AnimatedCurrencyProps> = ({
  valueMinor,
  currency,
  options,
  durationMs = 600,
  ...textProps
}) => {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(valueMinor);
  const fromRef = useRef(valueMinor);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced || durationMs <= 0) {
      setDisplay(valueMinor);
      fromRef.current = valueMinor;
      return;
    }

    const from = fromRef.current;
    const to = valueMinor;
    if (from === to) return;

    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / durationMs);
      const current = from + (to - from) * easeOutCubic(t);
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = valueMinor;
    };
  }, [valueMinor, durationMs, reduced]);

  return <Text {...textProps}>{formatCurrency(Math.round(display), currency, options)}</Text>;
};
