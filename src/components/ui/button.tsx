import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
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
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.white : colors.primary}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              variantTextStyles[variant],
              sizeTextStyles[size],
              icon ? { marginLeft: 6 } : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.transparent,
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

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.backgroundElevated, borderColor: colors.border },
  outline: { backgroundColor: colors.transparent, borderColor: colors.border },
  ghost: { backgroundColor: colors.transparent, borderColor: colors.transparent },
  destructive: { backgroundColor: colors.danger, borderColor: colors.danger },
};

const variantTextStyles: Record<Variant, TextStyle> = {
  primary: { color: colors.white },
  secondary: { color: colors.text },
  outline: { color: colors.text },
  ghost: { color: colors.textSecondary },
  destructive: { color: colors.white },
};

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
