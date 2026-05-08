import React, { useMemo } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, shadows } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { ColorTokens } from '@/lib/theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ visible, onClose, title, children, size = 'md' }: ModalProps) {
  const { tokens, typography } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);
  const maxWidth = size === 'sm' ? 400 : size === 'md' ? 520 : 680;

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.container, { maxWidth: Math.min(maxWidth, width - 32) }, shadows.elevated]}>
          <View style={styles.header}>
            <Text style={[typography.heading3, { flex: 1 }]}>{title}</Text>
            <Pressable
              onPress={onClose}
              style={((state: { hovered?: boolean }) => [styles.closeBtn, state.hovered ? { backgroundColor: tokens.surfaceHover } : null]) as any}
            >
              <Ionicons name="close" size={20} color={tokens.textSecondary} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

function makeStyles(c: ColorTokens, _typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    container: {
      width: '100%',
      maxHeight: '85%',
      backgroundColor: c.backgroundModal,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    body: {
      flexGrow: 0,
    },
    bodyContent: {
      padding: spacing.xl,
      gap: spacing.lg,
    },
  });
}
