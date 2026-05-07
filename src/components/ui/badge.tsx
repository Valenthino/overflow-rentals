import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.surface, text: colors.textSecondary },
  success: { bg: colors.successMuted, text: colors.success },
  warning: { bg: colors.warningMuted, text: colors.warning },
  danger: { bg: colors.dangerMuted, text: colors.danger },
  info: { bg: colors.infoMuted, text: colors.info },
  purple: { bg: colors.primaryMuted, text: colors.primary },
};

export function Badge({ label, variant = 'default', size = 'sm', style }: BadgeProps) {
  const c = variantColors[variant];
  return (
    <View
      style={[
        styles.badge,
        size === 'md' && styles.badgeMd,
        { backgroundColor: c.bg },
        style,
      ]}
    >
      <Text style={[styles.text, size === 'md' && styles.textMd, { color: c.text }]}>
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
