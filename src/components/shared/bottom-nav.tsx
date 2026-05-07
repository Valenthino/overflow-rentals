import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { BOTTOM_TAB_ITEMS } from '@/constants/navigation';
import { colors, spacing } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {BOTTOM_TAB_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/(app)' && pathname.startsWith(item.href));
        return (
          <TouchableOpacity
            key={item.href}
            style={styles.tab}
            onPress={() => router.push(item.href as any)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? item.activeIcon : item.icon}
              size={22}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => router.push('/(app)/expenses' as any)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={pathname.includes('/expenses') || pathname.includes('/claims') || pathname.includes('/settings') || pathname.includes('/team') ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'}
          size={22}
          color={pathname.includes('/expenses') || pathname.includes('/claims') || pathname.includes('/settings') || pathname.includes('/team') ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.label,
            (pathname.includes('/expenses') || pathname.includes('/claims') || pathname.includes('/settings') || pathname.includes('/team')) && styles.labelActive,
          ]}
        >
          More
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    ...(Platform.OS === 'web' ? { position: 'fixed' as any, bottom: 0, left: 0, right: 0, zIndex: 50 } : {}),
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
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
