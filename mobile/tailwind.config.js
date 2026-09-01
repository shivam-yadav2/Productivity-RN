/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      // Warm neutral scale replacing `zinc` app-wide — same shade numbering (50-950),
      // so every existing `zinc-N dark:zinc-M` pattern becomes `ink-N dark:ink-M`
      // unchanged in structure, just warmer values. Mirror in src/utils/theme.ts for
      // anywhere that needs a raw hex (icon `color` props, Reanimated interpolations).
      colors: {
        ink: {
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
        },
        // Card surfaces need to sit a step lighter than the page background in dark
        // mode for elevation contrast — `ink-900`/`ink-950` alone can't serve both.
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1C1B21',
        },
        // Namespaced (not `purple`/`orange`/etc) so these never collide with Tailwind's
        // own default color scales, which `extend` keeps available everywhere else.
        accentPurple: { bg: '#E9E2FB', DEFAULT: '#8B6FE8', deep: '#3D2E7A' },
        accentOrange: { bg: '#FCE8CB', DEFAULT: '#F4A340', deep: '#7A4A0F' },
        accentBlue: { bg: '#DCEBFC', DEFAULT: '#5FA8F5', deep: '#1D4E85' },
        accentPink: { bg: '#FBE1EC', DEFAULT: '#F291B8', deep: '#8A2E56' },
      },
      fontFamily: {
        jakarta: ['PlusJakartaSans_700Bold'],
        'jakarta-extrabold': ['PlusJakartaSans_800ExtraBold'],
      },
    },
  },
  plugins: [],
};
