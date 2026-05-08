import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, type ViewStyle, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, shadows } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { ColorTokens } from '@/lib/theme';

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
  iconColor,
  style,
}: KpiCardProps) {
  const { tokens, typography } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(8)).current;
  const [displayValue, setDisplayValue] = useState(value);

  const isPositive = change != null && change >= 0;
  const changeColor = change != null ? (isPositive ? tokens.success : tokens.danger) : undefined;
  const iColor = iconColor ?? tokens.primary;

  useEffect(() => {
    setDisplayValue(value);
    fade.setValue(0);
    slide.setValue(8);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 360, useNativeDriver: true }),
    ]).start();
  }, [value, fade, slide]);

  return (
    <View style={[styles.card, shadows.card, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {icon ? (
          <View style={[styles.iconContainer, { backgroundColor: `${iColor}1f` }]}>
            <Ionicons name={icon} size={16} color={iColor} />
          </View>
        ) : null}
      </View>
      <Animated.Text
        style={[styles.value, { opacity: fade, transform: [{ translateY: slide }] }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {displayValue}
      </Animated.Text>
      {change != null && Number.isFinite(change) ? (
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
          {changeLabel ? <Text style={styles.changeLabel}>{changeLabel}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

export function MiniKpi({ label, value, style }: { label: string; value: string; style?: ViewStyle }) {
  const { tokens, typography } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);
  return (
    <View style={[styles.miniCard, style]}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

function makeStyles(c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.backgroundCard,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
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
      width: 30,
      height: 30,
      borderRadius: radius.md,
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
      backgroundColor: c.surface,
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
      color: c.text,
    },
  });
}
