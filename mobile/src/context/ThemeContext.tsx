import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { AppTheme } from '../types';
import { settingsRepository } from '../database/repositories/settingsRepo';

interface ThemeContextType {
  theme: AppTheme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      return settingsRepository.get().theme || 'light';
    } catch {
      return 'light';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const systemColorScheme = useSystemColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();

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
