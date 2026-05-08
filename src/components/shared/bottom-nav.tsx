import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { BOTTOM_TAB_ITEMS } from '@/constants/navigation';
import { spacing } from '@/lib/theme';
import { useTokens } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LocaleProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ColorTokens } from '@/lib/theme';

const MORE_PATHS = ['/expenses', '/claims', '/settings', '/team', '/payouts', '/maintenance', '/cleaning', '/checklists', '/renters'];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const c = useTokens();
  const t = useT();
  const styles = useMemo(() => makeStyles(c), [c]);

  const moreActive = MORE_PATHS.some((p) => pathname.includes(p));

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {BOTTOM_TAB_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/(app)' && pathname.startsWith(item.href));
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
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {t(item.labelKey)}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        style={styles.tab}
        onPress={() => router.push('/(app)/expenses' as any)}
      >
        <Ionicons
          name={moreActive ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'}
          size={22}
          color={moreActive ? c.primary : c.textMuted}
        />
        <Text style={[styles.label, moreActive && styles.labelActive]}>{t('nav.more')}</Text>
      </Pressable>
    </View>
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
      ...(Platform.OS === 'web' ? ({ position: 'fixed' as any, bottom: 0, left: 0, right: 0, zIndex: 50 }) : {}),
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
  });
}
