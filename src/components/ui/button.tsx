import React, { useMemo, useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  type ViewStyle,
  type TextStyle,
  type GestureResponderEvent,
} from 'react-native';
import { radius, spacing } from '@/lib/theme';
import { useTokens } from '@/providers/ThemeProvider';
import type { ColorTokens } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: (e?: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const c = useTokens();
  const isDisabled = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

  const variantStyles = useMemo(() => makeVariants(c), [c]);
  const styles = useMemo(() => makeStyles(c), [c]);

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.fullWidth, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        style={((state: { hovered?: boolean }) => [
          styles.base,
          variantStyles[variant].container,
          sizeStyles[size],
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          state.hovered && !isDisabled ? variantStyles[variant].hover : null,
        ]) as any}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variantStyles[variant].text.color as string} />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.text,
                variantStyles[variant].text,
                sizeTextStyles[size],
                icon ? { marginLeft: 6 } : undefined,
                iconRight ? { marginRight: 6 } : undefined,
                textStyle,
              ]}
            >
              {title}
            </Text>
            {iconRight}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

function makeStyles(c: ColorTokens) {
  return StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.transparent,
    },
    text: {
      fontWeight: '600',
    },
    fullWidth: {
      width: '100%',
    },
    disabled: {
      opacity: 0.5,
    },
  });
}

function makeVariants(c: ColorTokens): Record<Variant, { container: ViewStyle; text: TextStyle; hover: ViewStyle }> {
  return {
    primary: {
      container: { backgroundColor: c.primary, borderColor: c.primary },
      text: { color: c.white },
      hover: { backgroundColor: c.primaryLight, borderColor: c.primaryLight },
    },
    secondary: {
      container: { backgroundColor: c.backgroundElevated, borderColor: c.border },
      text: { color: c.text },
      hover: { backgroundColor: c.backgroundHover, borderColor: c.borderLight },
    },
    outline: {
      container: { backgroundColor: c.transparent, borderColor: c.border },
      text: { color: c.text },
      hover: { backgroundColor: c.surfaceHover, borderColor: c.borderLight },
    },
    ghost: {
      container: { backgroundColor: c.transparent, borderColor: c.transparent },
      text: { color: c.textSecondary },
      hover: { backgroundColor: c.surface },
    },
    destructive: {
      container: { backgroundColor: c.danger, borderColor: c.danger },
      text: { color: c.white },
      hover: { backgroundColor: c.danger, borderColor: c.danger, opacity: 0.9 } as ViewStyle,
    },
  };
}

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, height: 32 },
  md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, height: 40 },
  lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, height: 48 },
};

const sizeTextStyles: Record<Size, TextStyle> = {
  sm: { fontSize: 12 },
  md: { fontSize: 14 },
  lg: { fontSize: 16 },
};
