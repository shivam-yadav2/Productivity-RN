/**
 * Raw hex mirror of tailwind.config.js's custom palette, for the two places NativeWind
 * `className` can't reach: `lucide-react-native` icon `color` props, and Reanimated
 * `useAnimatedStyle` interpolations. Keep these two files in sync by hand — there's no
 * automatic link between them.
 */

export const ink = {
  50: '#F7F5F2',
  100: '#EDEAE4',
  200: '#E1DBD0',
  300: '#CCC3B2',
  400: '#A79D8C',
  500: '#8A8680',
  600: '#6B655D',
  700: '#4A443B',
  800: '#2A2830',
  900: '#18161D',
  950: '#121116',
} as const;

export const surface = {
  light: '#FFFFFF',
  dark: '#1C1B21',
} as const;

export const accent = {
  purple: { bg: '#E9E2FB', base: '#8B6FE8', deep: '#3D2E7A' },
  orange: { bg: '#FCE8CB', base: '#F4A340', deep: '#7A4A0F' },
  blue: { bg: '#DCEBFC', base: '#5FA8F5', deep: '#1D4E85' },
  pink: { bg: '#FBE1EC', base: '#F291B8', deep: '#8A2E56' },
} as const;

/** `ink.900`/`ink.100` read correctly as text on a light surface but invert on dark —
 *  this resolves the right one for whichever `resolvedTheme` is active, for call sites
 *  that need a single value rather than a className's `dark:` variant (icon colors). */
export function inkText(isDark: boolean): string {
  return isDark ? ink[100] : ink[900];
}

export function inkMuted(isDark: boolean): string {
  return isDark ? '#8E8B96' : ink[500];
}

export function inkBorder(isDark: boolean): string {
  return isDark ? '#2A2830' : ink[100];
}

export function themeBg(isDark: boolean): string {
  return isDark ? ink[950] : ink[50];
}

export function themeSurface(isDark: boolean): string {
  return isDark ? surface.dark : surface.light;
}
