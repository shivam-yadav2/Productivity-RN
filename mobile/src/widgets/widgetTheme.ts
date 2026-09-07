import { ink, surface, accent } from '../utils/theme';
import { WidgetAccent } from '../types';

export type WidgetVariant = 'light' | 'dark';

export interface WidgetPalette {
  /** Card background. */
  bg: string;
  /** Primary/headline text. */
  text: string;
  /** Secondary text. */
  muted: string;
  /** Faint text (labels). */
  faint: string;
  /** Accent fill, used for dots/tiles. */
  accentFill: string;
  /** Background tint behind an accent element. */
  accentBg: string;
  /** Text that sits on top of `accentBg`. */
  accentText: string;
  /** An "empty"/unfilled element, e.g. an unlogged habit dot. */
  track: string;
}

const ACCENT_MAP: Record<Exclude<WidgetAccent, 'neutral'>, { bg: string; base: string; deep: string }> = {
  purple: accent.purple,
  orange: accent.orange,
  blue: accent.blue,
  pink: accent.pink,
};

/**
 * Android widgets can't read Tailwind classes or the app's ThemeContext — they render
 * through RemoteViews in a headless process — so every colour has to be resolved to a
 * literal hex here, for whichever variant the launcher asks for.
 */
export function widgetPalette(variant: WidgetVariant, accentName: WidgetAccent): WidgetPalette {
  const isDark = variant === 'dark';

  const base: WidgetPalette = {
    bg: isDark ? surface.dark : surface.light,
    text: isDark ? ink[100] : ink[900],
    muted: isDark ? '#B4B0AA' : ink[500],
    faint: isDark ? '#8E8B96' : ink[400],
    accentFill: isDark ? ink[100] : ink[900],
    accentBg: isDark ? ink[800] : ink[100],
    accentText: isDark ? ink[100] : ink[900],
    track: isDark ? ink[800] : ink[100],
  };

  if (accentName === 'neutral') return base;

  const a = ACCENT_MAP[accentName];
  return {
    ...base,
    accentFill: a.base,
    // In dark mode the pastel `bg` tint is far too bright to sit on a dark card, so the
    // saturated `deep` shade plays that role instead (same trade the in-app Tier-2 cards make).
    accentBg: isDark ? a.deep : a.bg,
    accentText: isDark ? '#FFFFFF' : a.deep,
  };
}
