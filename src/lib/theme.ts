import { StyleSheet, Platform, Dimensions } from 'react-native';

const BRAND = '#1F3A52';
const BRAND_LIGHT = '#2C547A';
const BRAND_DARK = '#152736';
const ACCENT = '#593CFB';
const ACCENT_LIGHT = '#7B62FC';

export interface ColorTokens {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryMuted: string;

  brand: string;
  brandLight: string;
  brandDark: string;

  background: string;
  backgroundElevated: string;
  backgroundCard: string;
  backgroundHover: string;
  backgroundModal: string;

  surface: string;
  surfaceHover: string;

  border: string;
  borderLight: string;
  borderFocus: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  danger: string;
  dangerMuted: string;
  info: string;
  infoMuted: string;

  chartPurple: string;
  chartBlue: string;
  chartGreen: string;
  chartOrange: string;
  chartRed: string;
  chartPink: string;
  chartCyan: string;
  chartGridLine: string;

  white: string;
  black: string;
  transparent: string;
  overlay: string;
}

const colorsDark: ColorTokens = {
  primary: ACCENT,
  primaryLight: ACCENT_LIGHT,
  primaryDark: '#4129D4',
  primaryMuted: 'rgba(89, 60, 251, 0.16)',

  brand: BRAND,
  brandLight: BRAND_LIGHT,
  brandDark: BRAND_DARK,

  background: '#0F1115',
  backgroundElevated: '#1A1D24',
  backgroundCard: '#16191F',
  backgroundHover: '#22262E',
  backgroundModal: '#0B0D11',

  surface: '#1F232B',
  surfaceHover: '#272C36',

  border: '#2A2F39',
  borderLight: '#3A4150',
  borderFocus: ACCENT,

  text: '#FFFFFF',
  textSecondary: '#B6BCC8',
  textMuted: '#7A8294',
  textInverse: '#0F1115',

  success: '#22C55E',
  successMuted: 'rgba(34, 197, 94, 0.16)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.16)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.16)',
  info: '#3B82F6',
  infoMuted: 'rgba(59, 130, 246, 0.16)',

  chartPurple: ACCENT,
  chartBlue: '#3B82F6',
  chartGreen: '#22C55E',
  chartOrange: '#F59E0B',
  chartRed: '#EF4444',
  chartPink: '#EC4899',
  chartCyan: '#06B6D4',
  chartGridLine: '#2A2F39',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.55)',
};

const colorsLight: ColorTokens = {
  primary: ACCENT,
  primaryLight: ACCENT_LIGHT,
  primaryDark: '#4129D4',
  primaryMuted: 'rgba(89, 60, 251, 0.10)',

  brand: BRAND,
  brandLight: BRAND_LIGHT,
  brandDark: BRAND_DARK,

  background: '#F7F8FA',
  backgroundElevated: '#FFFFFF',
  backgroundCard: '#FFFFFF',
  backgroundHover: '#F1F2F5',
  backgroundModal: '#FFFFFF',

  surface: '#F1F2F5',
  surfaceHover: '#E5E7EB',

  border: '#E5E7EB',
  borderLight: '#D1D5DB',
  borderFocus: ACCENT,

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  success: '#15803D',
  successMuted: 'rgba(34, 197, 94, 0.12)',
  warning: '#B45309',
  warningMuted: 'rgba(245, 158, 11, 0.14)',
  danger: '#B91C1C',
  dangerMuted: 'rgba(239, 68, 68, 0.10)',
  info: '#1D4ED8',
  infoMuted: 'rgba(59, 130, 246, 0.10)',

  chartPurple: ACCENT,
  chartBlue: '#2563EB',
  chartGreen: '#16A34A',
  chartOrange: '#D97706',
  chartRed: '#DC2626',
  chartPink: '#DB2777',
  chartCyan: '#0891B2',
  chartGridLine: '#E5E7EB',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(15,23,42,0.45)',
};

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const tokens: Record<ResolvedTheme, ColorTokens> = {
  dark: colorsDark,
  light: colorsLight,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 22,
  full: 9999,
} as const;

export function makeTypography(c: ColorTokens) {
  return {
    heading1: {
      fontSize: 30,
      fontWeight: '700' as const,
      letterSpacing: -0.6,
      color: c.text,
    },
    heading2: {
      fontSize: 22,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
      color: c.text,
    },
    heading3: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: c.text,
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      color: c.text,
      lineHeight: 22,
    },
    bodySmall: {
      fontSize: 13,
      fontWeight: '400' as const,
      color: c.textSecondary,
      lineHeight: 18,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: c.textMuted,
      letterSpacing: 0.2,
    },
    label: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: c.textSecondary,
    },
    kpiValue: {
      fontSize: 28,
      fontWeight: '700' as const,
      letterSpacing: -1,
      color: c.text,
    },
    kpiLabel: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: c.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
    },
    tabBar: {
      fontSize: 11,
      fontWeight: '500' as const,
    },
  };
}

export const shadows = Platform.select({
  ios: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
    },
  },
  android: {
    card: { elevation: 2 },
    elevated: { elevation: 10 },
  },
  web: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 36,
    },
  },
  default: {
    card: {},
    elevated: {},
  },
}) as {
  card: Record<string, unknown>;
  elevated: Record<string, unknown>;
};

export function useResponsive() {
  const { width } = Dimensions.get('window');
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isWideDesktop: width >= 1280,
    width,
  };
}

export const commonStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colorsDark.background,
  },
  screenPadding: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },
  gap20: { gap: 20 },
  gap24: { gap: 24 },
});
