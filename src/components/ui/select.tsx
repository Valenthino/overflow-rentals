import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, shadows } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { ColorTokens } from '@/lib/theme';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Select({
  label,
  placeholder = 'Select…',
  options,
  value,
  onValueChange,
  error,
  containerStyle,
}: SelectProps) {
  const { tokens, typography } = useTheme();
  const [open, setOpen] = useState(false);
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        style={((state: { hovered?: boolean; pressed: boolean }) => [
          styles.trigger,
          error && styles.triggerError,
          state.hovered && !error ? { borderColor: tokens.borderLight } : null,
          state.pressed ? { opacity: 0.9 } : null,
        ]) as any}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={tokens.textMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.dropdown, shadows.elevated]}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={((state: { hovered?: boolean }) => [
                    styles.option,
                    item.value === value && styles.optionActive,
                    state.hovered && item.value !== value ? { backgroundColor: tokens.surfaceHover } : null,
                  ]) as any}
                  onPress={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[styles.optionText, item.value === value && styles.optionTextActive]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value ? (
                    <Ionicons name="checkmark" size={16} color={tokens.primary} />
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    container: { gap: spacing.xs },
    label: { ...typography.label, marginBottom: 2 },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      height: 44,
      paddingHorizontal: spacing.md,
    },
    triggerError: { borderColor: c.danger },
    triggerText: { fontSize: 15, color: c.text, flex: 1 },
    placeholder: { color: c.textMuted },
    error: { fontSize: 12, color: c.danger },
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.overlay,
      padding: spacing.xl,
    },
    dropdown: {
      backgroundColor: c.backgroundModal,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      maxHeight: 320,
      width: '100%',
      maxWidth: 400,
      overflow: 'hidden',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    optionActive: { backgroundColor: c.primaryMuted },
    optionText: { fontSize: 15, color: c.text },
    optionTextActive: { color: c.primary, fontWeight: '600' },
  });
}
