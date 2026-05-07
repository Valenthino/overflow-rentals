import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { NAV_ITEMS, SECTION_LABELS } from '@/constants/navigation';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const sections = ['overview', 'operations', 'financial', 'admin'] as const;

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <View style={styles.logoIcon}>
          <Ionicons name="car-sport" size={22} color={colors.white} />
        </View>
        <View>
          <Text style={styles.logoTitle}>Overflow</Text>
          <Text style={styles.logoSubtitle}>Rentals</Text>
        </View>
      </View>

      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {sections.map((section) => {
          const items = NAV_ITEMS.filter((i) => i.section === section);
          if (items.length === 0) return null;
          return (
            <View key={section} style={styles.section}>
              <Text style={styles.sectionLabel}>{SECTION_LABELS[section]}</Text>
              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/(app)' && pathname.startsWith(item.href));
                return (
                  <TouchableOpacity
                    key={item.href}
                    style={[styles.navItem, isActive && styles.navItemActive]}
                    onPress={() => router.push(item.href as any)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isActive ? item.activeIcon : item.icon}
                      size={18}
                      color={isActive ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.user_metadata?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.user_metadata?.full_name ?? 'User'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    backgroundColor: colors.backgroundCard,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: spacing['3xl'],
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  logoSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  nav: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    marginBottom: 1,
  },
  navItemActive: {
    backgroundColor: colors.primaryMuted,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textMuted,
  },
  signOutBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
