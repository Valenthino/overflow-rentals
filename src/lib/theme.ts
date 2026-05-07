import { StyleSheet, Platform, Dimensions } from 'react-native';

export const colors = {
  primary: '#593CFB',
  primaryLight: '#7B62FC',
  primaryDark: '#4129D4',
  primaryMuted: 'rgba(89, 60, 251, 0.12)',

  background: '#1f1f1f',
  backgroundElevated: '#2a2a2a',
  backgroundCard: '#262626',
  backgroundHover: '#333333',
  backgroundModal: '#1a1a1a',

  surface: '#2e2e2e',
  surfaceHover: '#3a3a3a',

  border: '#3a3a3a',
  borderLight: '#444444',
  borderFocus: '#593CFB',

  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverse: '#1f1f1f',

  success: '#22C55E',
  successMuted: 'rgba(34, 197, 94, 0.12)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.12)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.12)',
  info: '#3B82F6',
  infoMuted: 'rgba(59, 130, 246, 0.12)',

  chartPurple: '#593CFB',
  chartBlue: '#3B82F6',
  chartGreen: '#22C55E',
  chartOrange: '#F59E0B',
  chartRed: '#EF4444',
  chartPink: '#EC4899',
  chartCyan: '#06B6D4',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

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
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const typography = {
  heading1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: colors.text,
  },
  heading2: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    color: colors.text,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.text,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -1,
    color: colors.text,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  tabBar: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
} as const;

export const shadows = Platform.select({
  ios: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
  },
  android: {
    card: { elevation: 3 },
    elevated: { elevation: 8 },
  },
  web: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
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
    backgroundColor: colors.background,
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
