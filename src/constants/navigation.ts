import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  activeIcon: IconName;
  section: 'overview' | 'operations' | 'financial' | 'admin';
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/(app)', icon: 'grid-outline', activeIcon: 'grid', section: 'overview' },
  { label: 'Fleet', href: '/(app)/fleet', icon: 'car-outline', activeIcon: 'car', section: 'overview' },
  { label: 'Bookings', href: '/(app)/bookings', icon: 'calendar-outline', activeIcon: 'calendar', section: 'operations' },
  { label: 'Trips', href: '/(app)/trips', icon: 'navigate-outline', activeIcon: 'navigate', section: 'operations' },
  { label: 'Renters', href: '/(app)/renters', icon: 'people-outline', activeIcon: 'people', section: 'operations' },
  { label: 'Cleaning', href: '/(app)/cleaning', icon: 'sparkles-outline', activeIcon: 'sparkles', section: 'operations' },
  { label: 'Maintenance', href: '/(app)/maintenance', icon: 'build-outline', activeIcon: 'build', section: 'operations' },
  { label: 'Checklists', href: '/(app)/checklists', icon: 'checkbox-outline', activeIcon: 'checkbox', section: 'operations' },
  { label: 'Expenses', href: '/(app)/expenses', icon: 'receipt-outline', activeIcon: 'receipt', section: 'financial' },
  { label: 'Claims', href: '/(app)/claims', icon: 'shield-outline', activeIcon: 'shield', section: 'financial' },
  { label: 'Payouts', href: '/(app)/payouts', icon: 'wallet-outline', activeIcon: 'wallet', section: 'financial' },
  { label: 'Reports', href: '/(app)/reports', icon: 'bar-chart-outline', activeIcon: 'bar-chart', section: 'financial' },
  { label: 'Team', href: '/(app)/team', icon: 'person-outline', activeIcon: 'person', section: 'admin' },
  { label: 'Settings', href: '/(app)/settings', icon: 'settings-outline', activeIcon: 'settings', section: 'admin' },
];

export const BOTTOM_TAB_ITEMS = NAV_ITEMS.filter((item) =>
  ['Dashboard', 'Fleet', 'Bookings', 'Trips', 'Reports'].includes(item.label)
);

export const SECTION_LABELS: Record<string, string> = {
  overview: 'Overview',
  operations: 'Operations',
  financial: 'Financial',
  admin: 'Admin',
};
