import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { NAV_ITEMS, SECTION_KEYS } from '@/constants/navigation';
import { radius, spacing } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useTokens } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LocaleProvider';
import { Logo } from '@/components/brand/logo';
import type { ColorTokens } from '@/lib/theme';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const c = useTokens();
  const t = useT();
  const styles = useMemo(() => makeStyles(c), [c]);

  const sections = ['overview', 'operations', 'financial', 'admin'] as const;
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const initial = fullName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Logo size="md" showTagline={false} />
      </View>

      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {sections.map((section) => {
          const items = NAV_ITEMS.filter((i) => i.section === section);
          if (items.length === 0) return null;
          return (
            <View key={section} style={styles.section}>
              <Text style={styles.sectionLabel}>{t(SECTION_KEYS[section])}</Text>
              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/(app)' && pathname.startsWith(item.href));
                return (
                  <Pressable
                    key={item.href}
                    style={((state: { hovered?: boolean; pressed: boolean }) => [
                      styles.navItem,
                      isActive && styles.navItemActive,
                      state.hovered && !isActive ? styles.navItemHover : null,
                      state.pressed ? { opacity: 0.85 } : null,
                    ]) as any}
                    onPress={() => router.push(item.href as any)}
                  >
                    <Ionicons
                      name={isActive ? item.activeIcon : item.icon}
                      size={18}
                      color={isActive ? c.primary : c.textMuted}
                    />
                    <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                      {t(item.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName} numberOfLines={1}>
              {fullName ?? user?.email?.split('@')[0] ?? 'User'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={signOut}
          style={((state: { hovered?: boolean }) => [
            styles.signOutBtn,
            state.hovered ? { backgroundColor: c.surfaceHover } : null,
          ]) as any}
        >
          <Ionicons name="log-out-outline" size={18} color={c.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
      width: 264,
      backgroundColor: c.backgroundCard,
      borderRightWidth: 1,
      borderRightColor: c.border,
      paddingTop: spacing['3xl'],
    },
    brand: {
      paddingHorizontal: spacing.xl,
      marginBottom: spacing['2xl'],
    },
    nav: {
      flex: 1,
      paddingHorizontal: spacing.md,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: c.textMuted,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.xs,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 9,
      borderRadius: radius.md,
      marginBottom: 2,
    },
    navItemHover: {
      backgroundColor: c.backgroundHover,
    },
    navItemActive: {
      backgroundColor: c.primaryMuted,
    },
    navLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: c.textMuted,
    },
    navLabelActive: {
      color: c.primary,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: c.border,
      gap: spacing.sm,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: c.white,
      fontWeight: '700',
      fontSize: 14,
    },
    userText: {
      flex: 1,
    },
    userName: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
    },
    userEmail: {
      fontSize: 11,
      color: c.textMuted,
    },
    signOutBtn: {
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
