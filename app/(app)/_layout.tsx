import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { Sidebar } from '@/components/shared/sidebar';
import { BottomNav } from '@/components/shared/bottom-nav';
import { colors } from '@/lib/theme';

export default function AppLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/(auth)/login');
    }
  }, [session, loading]);

  if (loading || !session) return null;

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <Sidebar />
        <View style={styles.mainContent}>
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mobileContainer}>
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
    backgroundColor: colors.background,
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mobileContent: {
    flex: 1,
    paddingBottom: Platform.OS === 'web' ? 64 : 0,
  },
});
