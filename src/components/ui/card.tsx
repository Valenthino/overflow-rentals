import React, { useMemo } from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing, shadows } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { ColorTokens } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'flat';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const { tokens } = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && shadows.elevated,
        variant === 'default' && shadows.card,
        variant === 'flat' && styles.flat,
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  const { tokens, typography } = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={typography.heading3}>{title}</Text>
        {subtitle ? <Text style={[typography.bodySmall, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function CardContent({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[contentStyles.content, style]}>{children}</View>;
}

export function CardFooter({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { tokens } = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  return <View style={[styles.footer, style]}>{children}</View>;
}

const contentStyles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});

function makeStyles(c: ColorTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.backgroundCard,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    flat: {
      shadowOpacity: 0,
      elevation: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerText: {
      flex: 1,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
  });
}
