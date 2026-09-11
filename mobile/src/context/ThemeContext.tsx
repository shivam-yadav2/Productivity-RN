import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { AppTheme } from '../types';
import { settingsRepository } from '../database/repositories/settingsRepo';
import { dbEngine } from '../database/db';

interface ThemeContextType {
  theme: AppTheme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Starts at the default, NOT at the stored value: this provider mounts above
  // DatabaseProvider and `dbEngine.init()` is async, so at this point the database is
  // still empty and reading it here always returned 'light'. The stored theme is adopted
  // in the hydration effect below, once the data has actually loaded.
  const [theme, setThemeState] = useState<AppTheme>('light');
  const hasHydrated = useRef(false);

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const systemColorScheme = useSystemColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();

  /**
   * Adopt the saved theme once the database has loaded.
   *
   * Subscribing rather than reading on mount keeps this independent of provider order —
   * `dbEngine.init()` fires a notification when it finishes, whoever is listening. The
   * `hasHydrated` guard means a theme the user changes afterwards is never clobbered by a
   * later write to some unrelated table.
   */
  useEffect(() => {
    const hydrate = () => {
      if (hasHydrated.current) return;
      try {
        const stored = settingsRepository.get().theme;
        hasHydrated.current = true;
        if (stored) setThemeState(stored);
      } catch {
        // Leave the default in place if settings can't be read.
      }
    };

    const unsubscribe = dbEngine.subscribe(hydrate);
    return unsubscribe;
  }, []);

  useEffect(() => {
    let isDark = false;
    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'system') {
      isDark = systemColorScheme === 'dark';
    }

    setResolvedTheme(isDark ? 'dark' : 'light');
    // Drive NativeWind's dark: variant resolution to match our resolved theme.
    setColorScheme(theme);
  }, [theme, systemColorScheme, setColorScheme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    settingsRepository.update({ theme: newTheme });
  };

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
