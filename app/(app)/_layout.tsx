import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform, ActivityIndicator } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useTokens } from '@/providers/ThemeProvider';
import { useSettings } from '@/hooks/useSupabaseCrud';
import { Sidebar } from '@/components/shared/sidebar';
import { BottomNav } from '@/components/shared/bottom-nav';

export default function AppLayout() {
  const { session, loading } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const c = useTokens();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/(auth)/login');
    }
  }, [session, loading]);

  // Redirect first-time users to onboarding once their settings have loaded.
  useEffect(() => {
    if (loading || !session || settingsLoading) return;
    const done = settings.onboarding_complete === 'true';
    const onOnboarding = pathname?.includes('/onboarding');
    if (!done && !onOnboarding) {
      router.replace('/(app)/onboarding' as any);
    }
  }, [session, loading, settingsLoading, settings.onboarding_complete, pathname]);

  if (loading || !session) return null;

  // Wait for the user's settings before deciding which view to show — avoids
  // flashing the dashboard for first-time users who should be in onboarding.
  if (settingsLoading) {
    return (
      <View style={[styles.mobileContainer, { backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const onboardingDone = settings.onboarding_complete === 'true';
  const onOnboarding = pathname?.includes('/onboarding');
  if (!onboardingDone && !onOnboarding) return null;

  if (onOnboarding) {
    return (
      <View style={[styles.mobileContainer, { backgroundColor: c.background }]}>
        <Slot />
      </View>
    );
  }

  if (isDesktop) {
    return (
      <View style={[styles.desktopContainer, { backgroundColor: c.background }]}>
        <Sidebar />
        <View style={[styles.mainContent, { backgroundColor: c.background }]}>
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mobileContainer, { backgroundColor: c.background }]}>
      <View style={styles.mobileContent}>
        <Slot />
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
  },
  mobileContainer: {
    flex: 1,
  },
  mobileContent: {
    flex: 1,
    paddingBottom: Platform.OS === 'web' ? 64 : 0,
  },
});
