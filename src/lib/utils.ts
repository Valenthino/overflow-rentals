import { format, parseISO, differenceInDays, isValid } from 'date-fns';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, fmt);
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, 'MMM d');
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function daysRemaining(endDate: string | Date): number {
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return differenceInDays(end, new Date());
}

export function getInitials(name: string): string {
  return name
    .split(' ')
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

export function getStatusColor(status: string): string {
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

export function parseDollar(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,\s]/g, '');
  const negative = cleaned.startsWith('-') || value.includes('- $');
  const num = parseFloat(cleaned.replace('-', ''));
  return isNaN(num) ? 0 : negative ? -num : num;
}
