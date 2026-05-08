import { en, type Translations } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';

export type Locale = 'en' | 'es' | 'fr';

export const SUPPORTED_LOCALES: { code: Locale; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
];

export const DICTIONARIES: Record<Locale, Translations> = { en, es, fr };

type DotPath<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? DotPath<T[K], `${P}${K}.`>
    : `${P}${K}`;
}[keyof T & string];

export type TranslationKey = DotPath<Translations>;

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = cur[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? '' : String(v);
  });
}

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES.en;
  const fallback = DICTIONARIES.en;
  const raw = getByPath(dict, key) ?? getByPath(fallback, key) ?? key;
  return vars ? interpolate(raw, vars) : raw;
}

export { en, es, fr };
export type { Translations };
