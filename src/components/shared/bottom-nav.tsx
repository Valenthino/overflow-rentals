import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { BOTTOM_TAB_ITEMS, MORE_TAB_ITEMS } from '@/constants/navigation';
import { radius, spacing } from '@/lib/theme';
import { useTokens } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LocaleProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '@/components/ui/modal';
import type { ColorTokens } from '@/lib/theme';

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const c = useTokens();
  const t = useT();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [moreOpen, setMoreOpen] = useState(false);

  const isItemActive = (href: string) =>
    pathname === href || (href !== '/(app)' && pathname.startsWith(href));

  const moreActive = MORE_TAB_ITEMS.some((i) => isItemActive(i.href));

  const navigate = (href: string) => {
    setMoreOpen(false);
    router.push(href as any);
  };

  return (
    <>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {BOTTOM_TAB_ITEMS.map((item) => {
          const isActive = isItemActive(item.href);
          return (
            <Pressable
              key={item.href}
              style={styles.tab}
              onPress={() => router.push(item.href as any)}
            >
              <Ionicons
                name={isActive ? item.activeIcon : item.icon}
                size={22}
                color={isActive ? c.primary : c.textMuted}
              />
              <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
                {t(item.labelKey)}
              </Text>
            </Pressable>
          );
        })}
        <Pressable style={styles.tab} onPress={() => setMoreOpen(true)}>
          <Ionicons
            name={moreActive ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'}
            size={22}
            color={moreActive ? c.primary : c.textMuted}
          />
          <Text style={[styles.label, moreActive && styles.labelActive]}>{t('nav.more')}</Text>
        </Pressable>
      </View>

      <Modal visible={moreOpen} onClose={() => setMoreOpen(false)} title={t('nav.more')} size="sm">
        <View style={styles.moreList}>
          {MORE_TAB_ITEMS.map((item) => {
            const isActive = isItemActive(item.href);
            return (
              <Pressable
                key={item.href}
                onPress={() => navigate(item.href)}
                style={((state: { hovered?: boolean; pressed: boolean }) => [
                  styles.moreRow,
                  state.hovered || state.pressed ? { backgroundColor: c.surfaceHover } : null,
                ]) as any}
              >
                <View
                  style={[
                    styles.moreIcon,
                    { backgroundColor: isActive ? c.primaryMuted : c.surface },
                  ]}
                >
                  <Ionicons
                    name={isActive ? item.activeIcon : item.icon}
                    size={20}
                    color={isActive ? c.primary : c.textSecondary}
                  />
                </View>
                <Text style={[styles.moreLabel, isActive && styles.moreLabelActive]}>
                  {t(item.labelKey)}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

function makeStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: c.backgroundCard,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: spacing.sm,
      ...(Platform.OS === 'web'
        ? ({ position: 'fixed' as any, bottom: 0, left: 0, right: 0, zIndex: 50 })
        : {}),
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      paddingVertical: 2,
    },
    label: {
      fontSize: 10,
      fontWeight: '500',
      color: c.textMuted,
    },
    labelActive: {
      color: c.primary,
      fontWeight: '600',
    },
    moreList: {
      gap: spacing.xs,
    },
    moreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
    },
    moreIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moreLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: c.text,
    },
    moreLabelActive: {
      color: c.primary,
      fontWeight: '600',
    },
  });
}
