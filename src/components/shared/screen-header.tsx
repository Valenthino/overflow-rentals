import React, { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { spacing } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { ColorTokens } from '@/lib/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({ title, subtitle, action, style }: ScreenHeaderProps) {
  const { tokens, typography } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

function makeStyles(c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
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
}
