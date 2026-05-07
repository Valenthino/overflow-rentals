import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '@/lib/theme';

interface KpiCardProps {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  style?: ViewStyle;
}

export function KpiCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  iconColor = colors.primary,
  style,
}: KpiCardProps) {
  const isPositive = change != null && change >= 0;
  const changeColor = change != null ? (isPositive ? colors.success : colors.danger) : undefined;

  return (
    <View style={[styles.card, shadows.card, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}18` }]}>
            <Ionicons name={icon} size={16} color={iconColor} />
          </View>
        )}
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {change != null && (
        <View style={styles.changeRow}>
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={changeColor}
          />
          <Text style={[styles.changeValue, { color: changeColor }]}>
            {isPositive ? '+' : ''}
            {change.toFixed(1)}%
          </Text>
          {changeLabel && <Text style={styles.changeLabel}>{changeLabel}</Text>}
        </View>
      )}
    </View>
  );
}

export function MiniKpi({ label, value, style }: { label: string; value: string; style?: ViewStyle }) {
  return (
    <View style={[styles.miniCard, style]}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.kpiLabel,
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...typography.kpiValue,
    marginBottom: spacing.xs,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  changeLabel: {
    ...typography.caption,
  },
  miniCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  miniLabel: {
    ...typography.caption,
    marginBottom: 4,
  },
  miniValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
});
