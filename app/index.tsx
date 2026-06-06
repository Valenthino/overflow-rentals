import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useTokens } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LocaleProvider';
import { LogoMark } from '@/components/brand/logo';
import { missingEnvVars, isSupabaseConfigured } from '@/lib/supabase';
import { spacing, radius } from '@/lib/theme';

export default function Index() {
  const { session, loading, configured, recoveryMode } = useAuth();
  const router = useRouter();
  const c = useTokens();
  const t = useT();

  useEffect(() => {
    if (loading) return;
    if (!configured) return;
    // A password-reset link was opened — send the user to set a new password,
    // even though the recovery exchange has already created a session.
    if (recoveryMode) {
      router.replace('/(auth)/reset-password' as any);
    } else if (session) {
      router.replace('/(app)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [session, loading, configured, recoveryMode]);

  if (!isSupabaseConfigured) {
    return (
      <ScrollView contentContainerStyle={[styles.center, { backgroundColor: c.background, padding: spacing.xl }]}>
        <View style={[styles.card, { backgroundColor: c.backgroundCard, borderColor: c.border }]}>
          <LogoMark size={48} />
          <Text style={[styles.title, { color: c.text }]}>{t('auth.config_missing_title')}</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>
            {t('auth.config_missing_body', { vars: missingEnvVars.join(', ') })}
          </Text>
          {Platform.OS !== 'web' ? (
            <Text style={[styles.hint, { color: c.textMuted }]}>
              For native builds: define the variables in your EAS build profile (eas.json → build.&lt;profile&gt;.env)
              and rebuild. Expo bakes EXPO_PUBLIC_* vars at build time, not runtime.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.center, { backgroundColor: c.background }]}>
      <ActivityIndicator size="large" color={c.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
});
