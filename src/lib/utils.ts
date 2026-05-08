import { format, parseISO, differenceInDays, isValid } from 'date-fns';

const DEFAULT_LOCALE = 'en-US';

const currencyByLocale: Record<string, string> = {
  en: 'USD',
  'en-US': 'USD',
  'en-CA': 'CAD',
  'en-GB': 'GBP',
  fr: 'EUR',
  'fr-CA': 'CAD',
  'fr-FR': 'EUR',
  es: 'EUR',
  'es-ES': 'EUR',
  'es-MX': 'MXN',
};

let activeLocale: string = DEFAULT_LOCALE;
let activeCurrency: string = 'USD';

export function setFormattingLocale(locale: string, currencyOverride?: string): void {
  activeLocale = locale || DEFAULT_LOCALE;
  if (currencyOverride) {
    activeCurrency = currencyOverride;
    return;
  }
  activeCurrency = currencyByLocale[activeLocale] ?? currencyByLocale[activeLocale.slice(0, 2)] ?? 'USD';
}

export function getFormattingLocale(): { locale: string; currency: string } {
  return { locale: activeLocale, currency: activeCurrency };
}

export function formatCurrency(amount: number | null | undefined, currency?: string): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency: currency ?? activeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(0);
  }
  return new Intl.NumberFormat(activeLocale, {
    style: 'currency',
    currency: currency ?? activeCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined, fmt = 'MMM d, yyyy'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, fmt);
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, 'MMM d');
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  return new Intl.NumberFormat(activeLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rounded) + '%';
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(activeLocale).format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function daysRemaining(endDate: string | Date | null | undefined): number {
  if (!endDate) return 0;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  if (!isValid(end)) return 0;
  return differenceInDays(end, new Date());
}

export function daysBetween(start: string | Date | null | undefined, end: string | Date | null | undefined): number {
  if (!start || !end) return 0;
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;
  if (!isValid(s) || !isValid(e)) return 0;
  if (e < s) return 0;
  const diff = differenceInDays(e, s);
  return diff === 0 ? 1 : diff + 1;
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '…';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function safeDivide(a: number, b: number, fallback = 0): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return fallback;
  const result = a / b;
  return Number.isFinite(result) ? result : fallback;
}

export function safePercent(part: number, whole: number, fallback = 0): number {
  return safeDivide(part, whole, fallback) * 100;
}

export function getStatusColor(status: string | null | undefined): string {
  if (!status) return '#71717A';
  const map: Record<string, string> = {
    active: '#22C55E',
    upcoming: '#3B82F6',
    completed: '#71717A',
    cancelled: '#EF4444',
    pending: '#F59E0B',
    in_progress: '#593CFB',
    resolved: '#22C55E',
    open: '#F59E0B',
    closed: '#71717A',
    available: '#22C55E',
    rented: '#593CFB',
    maintenance: '#F59E0B',
    retired: '#71717A',
  };
  return map[status.toLowerCase()] || '#71717A';
}

export function parseDollar(value: string | null | undefined): number {
  if (!value) return 0;
  const cleaned = String(value).replace(/[$,\s]/g, '');
  if (!cleaned) return 0;
  const negative = cleaned.startsWith('-') || (typeof value === 'string' && value.includes('- $'));
  const num = parseFloat(cleaned.replace(/^-/, ''));
  return Number.isFinite(num) ? (negative ? -num : num) : 0;
}

export function parseIntSafe(value: string | null | undefined): { value: number; ok: boolean } {
  if (value === null || value === undefined || value === '') return { value: 0, ok: true };
  const cleaned = String(value).replace(/[^0-9-]/g, '');
  if (!cleaned || cleaned === '-') return { value: 0, ok: false };
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) ? { value: num, ok: true } : { value: 0, ok: false };
}
