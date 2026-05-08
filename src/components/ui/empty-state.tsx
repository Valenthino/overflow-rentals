import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from './button';
import type { ColorTokens } from '@/lib/theme';
import type { ComponentProps } from 'react';

interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const { tokens, typography } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={40} color={tokens.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} size="sm" style={{ marginTop: spacing.lg }} />
      ) : null}
    </View>
  );
}

function makeStyles(c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing['5xl'],
      paddingHorizontal: spacing.xl,
    },
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.heading3,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    description: {
      ...typography.bodySmall,
      textAlign: 'center',
      maxWidth: 280,
    },
  });
}
