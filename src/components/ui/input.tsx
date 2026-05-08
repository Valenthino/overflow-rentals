import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { radius, spacing } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { ColorTokens } from '@/lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helper,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  ...props
}: InputProps) {
  const { tokens, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const ringWidth = useRef(new Animated.Value(0)).current;
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  const animateRing = (to: number) =>
    Animated.timing(ringWidth, { toValue: to, duration: 140, useNativeDriver: false }).start();

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
          error && styles.inputError,
          focused && !error
            ? {
                borderColor: tokens.primary,
                shadowColor: tokens.primary,
                shadowOpacity: 0.18,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
                elevation: 0,
              }
            : null,
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          style={[styles.input, leftIcon ? { paddingLeft: 0 } : undefined, style]}
          placeholderTextColor={tokens.textMuted}
          onFocus={(e) => {
            setFocused(true);
            animateRing(1);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            animateRing(0);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {helper && !error ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

function makeStyles(c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    container: { gap: spacing.xs },
    label: {
      ...typography.label,
      marginBottom: 2,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      height: 44,
    },
    inputFocused: {
      borderColor: c.borderFocus,
    },
    inputError: {
      borderColor: c.danger,
    },
    input: {
      flex: 1,
      height: '100%',
      paddingHorizontal: spacing.md,
      color: c.text,
      fontSize: 15,
    },
    iconLeft: { paddingLeft: spacing.md },
    iconRight: { paddingRight: spacing.md },
    error: { fontSize: 12, color: c.danger },
    helper: { fontSize: 12, color: c.textMuted },
  });
}
