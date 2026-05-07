import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({ title, subtitle, action, style }: ScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.heading1,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 4,
  },
});
