import React, { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { radius, spacing } from '@/lib/theme';
import { useTokens } from '@/providers/ThemeProvider';
import type { ColorTokens } from '@/lib/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

function colorsForVariant(c: ColorTokens, variant: BadgeVariant): { bg: string; text: string } {
  switch (variant) {
    case 'success':
      return { bg: c.successMuted, text: c.success };
    case 'warning':
      return { bg: c.warningMuted, text: c.warning };
    case 'danger':
      return { bg: c.dangerMuted, text: c.danger };
    case 'info':
      return { bg: c.infoMuted, text: c.info };
    case 'purple':
      return { bg: c.primaryMuted, text: c.primary };
    case 'default':
    default:
      return { bg: c.surface, text: c.textSecondary };
  }
}

export function Badge({ label, variant = 'default', size = 'sm', style }: BadgeProps) {
  const c = useTokens();
  const palette = useMemo(() => colorsForVariant(c, variant), [c, variant]);
  return (
    <View
      style={[
        styles.badge,
        size === 'md' && styles.badgeMd,
        { backgroundColor: palette.bg },
        style,
      ]}
    >
      <Text style={[styles.text, size === 'md' && styles.textMd, { color: palette.text }]}>
        {label}
      </Text>
    </View>
  );
}

export function StatusDot({ color }: { color: string }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  textMd: {
    fontSize: 13,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
