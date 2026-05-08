import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  DICTIONARIES,
  SUPPORTED_LOCALES,
  translate,
  type Locale,
} from '@/lib/i18n';
import { setFormattingLocale } from '@/lib/utils';

const STORAGE_KEY = 'overflow.locale';

const LOCALE_TO_INTL: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-CA',
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  available: typeof SUPPORTED_LOCALES;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function detectInitialLocale(): Locale {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === 'en' || stored === 'es' || stored === 'fr') return stored;
      }
      if (typeof navigator !== 'undefined' && navigator.language) {
        const code = navigator.language.slice(0, 2).toLowerCase();
        if (code === 'es' || code === 'fr' || code === 'en') return code;
      }
    } catch {
      // ignore
    }
  }
  return 'en';
}

function persistLocale(l: Locale) {
  if (Platform.OS !== 'web') return;
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, l);
  } catch {
    // ignore
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const initial = detectInitialLocale();
    setFormattingLocale(LOCALE_TO_INTL[initial]);
    return initial;
  });

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
    setFormattingLocale(LOCALE_TO_INTL[next]);
  }, []);

  useEffect(() => {
    setFormattingLocale(LOCALE_TO_INTL[locale]);
  }, [locale]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, available: SUPPORTED_LOCALES, t }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: 'en',
      setLocale: () => {},
      available: SUPPORTED_LOCALES,
      t: (key, vars) => translate('en', key, vars),
    };
  }
  return ctx;
}

export function useT() {
  return useLocale().t;
}
