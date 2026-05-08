import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Appearance, Platform } from 'react-native';
import { tokens, type ColorTokens, type ThemeMode, type ResolvedTheme, makeTypography } from '@/lib/theme';

const STORAGE_KEY = 'overflow.theme.mode';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  tokens: ColorTokens;
  typography: ReturnType<typeof makeTypography>;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSystemTheme(): ResolvedTheme {
  try {
    const scheme = Appearance.getColorScheme();
    return scheme === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function readStoredMode(): ThemeMode {
  if (Platform.OS !== 'web') return 'system';
  try {
    if (typeof window === 'undefined') return 'system';
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // ignore
  }
  return 'system';
}

function persistMode(mode: ThemeMode) {
  if (Platform.OS !== 'web') return;
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => readSystemTheme());

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme === 'light' ? 'light' : 'dark');
    });
    return () => sub.remove();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    persistMode(next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved: ResolvedTheme = mode === 'system' ? systemTheme : mode;
    const t = tokens[resolved];
    return {
      mode,
      resolved,
      tokens: t,
      typography: makeTypography(t),
      setMode,
    };
  }, [mode, systemTheme, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      mode: 'system',
      resolved: 'dark',
      tokens: tokens.dark,
      typography: makeTypography(tokens.dark),
      setMode: () => {},
    };
  }
  return ctx;
}

export function useTokens(): ColorTokens {
  return useTheme().tokens;
}

export function useTypography() {
  return useTheme().typography;
}
