import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface NavItem {
  labelKey: string;
  href: string;
  icon: IconName;
  activeIcon: IconName;
  section: 'overview' | 'operations' | 'financial' | 'admin';
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', href: '/(app)', icon: 'grid-outline', activeIcon: 'grid', section: 'overview' },
  { labelKey: 'nav.fleet', href: '/(app)/fleet', icon: 'car-outline', activeIcon: 'car', section: 'overview' },
  { labelKey: 'nav.bookings', href: '/(app)/bookings', icon: 'calendar-outline', activeIcon: 'calendar', section: 'operations' },
  { labelKey: 'nav.trips', href: '/(app)/trips', icon: 'navigate-outline', activeIcon: 'navigate', section: 'operations' },
  { labelKey: 'nav.renters', href: '/(app)/renters', icon: 'people-outline', activeIcon: 'people', section: 'operations' },
  { labelKey: 'nav.cleaning', href: '/(app)/cleaning', icon: 'sparkles-outline', activeIcon: 'sparkles', section: 'operations' },
  { labelKey: 'nav.maintenance', href: '/(app)/maintenance', icon: 'build-outline', activeIcon: 'build', section: 'operations' },
  { labelKey: 'nav.checklists', href: '/(app)/checklists', icon: 'checkbox-outline', activeIcon: 'checkbox', section: 'operations' },
  { labelKey: 'nav.expenses', href: '/(app)/expenses', icon: 'receipt-outline', activeIcon: 'receipt', section: 'financial' },
  { labelKey: 'nav.claims', href: '/(app)/claims', icon: 'shield-outline', activeIcon: 'shield', section: 'financial' },
  { labelKey: 'nav.payouts', href: '/(app)/payouts', icon: 'wallet-outline', activeIcon: 'wallet', section: 'financial' },
  { labelKey: 'nav.reports', href: '/(app)/reports', icon: 'bar-chart-outline', activeIcon: 'bar-chart', section: 'financial' },
  { labelKey: 'nav.team', href: '/(app)/team', icon: 'person-outline', activeIcon: 'person', section: 'admin' },
  { labelKey: 'nav.settings', href: '/(app)/settings', icon: 'settings-outline', activeIcon: 'settings', section: 'admin' },
];

const BOTTOM_TAB_KEYS = new Set(['nav.dashboard', 'nav.fleet', 'nav.bookings', 'nav.trips', 'nav.reports']);
export const BOTTOM_TAB_ITEMS = NAV_ITEMS.filter((item) => BOTTOM_TAB_KEYS.has(item.labelKey));

// Everything not surfaced as a primary tab lives behind the "More" sheet on mobile.
export const MORE_TAB_ITEMS = NAV_ITEMS.filter((item) => !BOTTOM_TAB_KEYS.has(item.labelKey));

export const SECTION_KEYS: Record<NavItem['section'], string> = {
  overview: 'nav.overview',
  operations: 'nav.operations',
  financial: 'nav.financial',
  admin: 'nav.admin',
};
