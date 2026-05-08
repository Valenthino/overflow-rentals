import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { useMaintenanceReminders, type MaintenanceReminder } from '@/hooks/useMaintenanceReminders';
import { spacing, radius } from '@/lib/theme';
import type { ColorTokens } from '@/lib/theme';

const TYPE_LABEL: Record<string, string> = {
  oil_change: 'Oil change',
  tire_rotation: 'Tire rotation',
  brake_service: 'Brake service',
  battery: 'Battery',
  transmission: 'Transmission service',
  coolant: 'Coolant flush',
  air_filter: 'Air filter',
  cabin_filter: 'Cabin filter',
  spark_plugs: 'Spark plugs',
  alignment: 'Wheel alignment',
  inspection: 'Inspection',
  recall: 'Recall',
  other: 'Service',
};

function describeReminder(r: MaintenanceReminder): string {
  const label = TYPE_LABEL[r.type] ?? 'Service';
  if (r.severity === 'overdue') {
    if (r.days_until_due != null && r.days_until_due < 0) {
      return `${label} ${Math.abs(r.days_until_due)}d overdue`;
    }
    if (r.km_until_due != null && r.km_until_due < 0) {
      return `${label} ${Math.abs(r.km_until_due).toLocaleString()} km overdue`;
    }
    return `${label} overdue`;
  }
  if (r.days_until_due != null && r.days_until_due >= 0) {
    return r.days_until_due === 0
      ? `${label} due today`
      : `${label} due in ${r.days_until_due}d`;
  }
  if (r.km_until_due != null && r.km_until_due >= 0) {
    return `${label} due in ${r.km_until_due.toLocaleString()} km`;
  }
  return label;
}

export function MaintenanceReminderBanner() {
  const router = useRouter();
  const { tokens, typography } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);
  const { reminders, loading } = useMaintenanceReminders();
  const [collapsed, setCollapsed] = useState(false);

  if (loading || reminders.length === 0 || collapsed) return null;

  const overdueCount = reminders.filter((r) => r.severity === 'overdue').length;
  const isOverdue = overdueCount > 0;
  const accent = isOverdue ? tokens.danger : tokens.warning;
  const accentMuted = isOverdue ? tokens.dangerMuted : tokens.warningMuted;
  const visible = reminders.slice(0, 3);

  return (
    <View style={[styles.wrap, { backgroundColor: accentMuted, borderColor: accent }]}>
      <View style={styles.iconCircle}>
        <Ionicons name="construct" size={18} color={accent} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: accent }]}>
          {isOverdue
            ? `${overdueCount} maintenance ${overdueCount === 1 ? 'item' : 'items'} overdue`
            : `${reminders.length} maintenance ${reminders.length === 1 ? 'reminder' : 'reminders'} coming up`}
        </Text>
        {visible.map((r) => (
          <Text key={r.id} style={styles.row} numberOfLines={1}>
            {r.vehicle_name} · {describeReminder(r)}
          </Text>
        ))}
        {reminders.length > visible.length ? (
          <Text style={styles.more}>+ {reminders.length - visible.length} more</Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push('/(app)/maintenance' as any)}
          style={((state: { hovered?: boolean }) => [
            styles.actionBtn,
            { borderColor: accent },
            state.hovered ? { backgroundColor: accent + '22' } : null,
          ]) as any}
        >
          <Text style={[styles.actionText, { color: accent }]}>View</Text>
        </Pressable>
        <Pressable
          onPress={() => setCollapsed(true)}
          hitSlop={8}
          style={styles.dismissBtn}
        >
          <Ionicons name="close" size={16} color={tokens.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(
  c: ColorTokens,
  typography: ReturnType<typeof import('@/lib/theme').makeTypography>,
) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      marginBottom: spacing.lg,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.backgroundCard,
      marginTop: 2,
    },
    content: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    row: {
      ...typography.caption,
      color: c.text,
    },
    more: {
      ...typography.caption,
      marginTop: spacing.xs,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    actionBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '600',
    },
    dismissBtn: {
      padding: 4,
    },
  });
}
