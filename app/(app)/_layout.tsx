import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useTokens } from '@/providers/ThemeProvider';
import { Sidebar } from '@/components/shared/sidebar';
import { BottomNav } from '@/components/shared/bottom-nav';

export default function AppLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const c = useTokens();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/(auth)/login');
    }
  }, [session, loading]);

  if (loading || !session) return null;

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
