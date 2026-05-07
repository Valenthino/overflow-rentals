import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '@/lib/theme';

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
  placeholder = 'Select...',
  options,
  value,
  onValueChange,
  error,
  containerStyle,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, error && styles.triggerError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={[styles.dropdown, shadows.elevated]}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.value === value && styles.optionActive]}
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
                  {item.value === value && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    marginBottom: 2,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
    paddingHorizontal: spacing.md,
  },
  triggerError: {
    borderColor: colors.danger,
  },
  triggerText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.xl,
  },
  dropdown: {
    backgroundColor: colors.backgroundModal,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderBottomColor: colors.border,
  },
  optionActive: {
    backgroundColor: colors.primaryMuted,
  },
  optionText: {
    fontSize: 15,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
