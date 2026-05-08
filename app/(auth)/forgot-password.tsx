import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LocaleProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { spacing, radius } from '@/lib/theme';
import type { ColorTokens } from '@/lib/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const { tokens, typography } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email) {
      setError(t('auth.enter_email'));
      return;
    }
    setLoading(true);
    setError('');
    const result = await resetPassword(email.trim());
    if (result.error) {
      setError(result.error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <View style={styles.successIcon}>
            <Ionicons name="mail" size={48} color={tokens.primary} />
          </View>
          <Text style={styles.title}>{t('auth.check_email')}</Text>
          <Text style={styles.subtitle}>{t('auth.check_email_reset', { email })}</Text>
          <Button
            title={t('auth.back_to_signin')}
            onPress={() => router.replace('/(auth)/login')}
            variant="outline"
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={tokens.textSecondary} />
        </Pressable>
        <Text style={styles.title}>{t('auth.reset_password')}</Text>
        <Text style={styles.subtitle}>{t('auth.reset_subtitle')}</Text>
        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={tokens.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <Input
            label={t('auth.email')}
            placeholder={t('auth.email_placeholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            leftIcon={<Ionicons name="mail-outline" size={18} color={tokens.textMuted} />}
          />
          <Button title={t('auth.send_reset')} onPress={handleReset} loading={loading} fullWidth size="lg" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    container: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      padding: spacing.xl,
      flex: 1,
      justifyContent: 'center',
    },
    centered: { alignItems: 'center' },
    backBtn: { marginBottom: spacing.xl, alignSelf: 'flex-start' },
    title: { ...typography.heading1, marginBottom: spacing.xs },
    subtitle: { ...typography.bodySmall, marginBottom: spacing['3xl'] },
    form: { gap: spacing.lg },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.dangerMuted,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    errorText: { color: c.danger, fontSize: 13, flex: 1 },
    successIcon: { marginBottom: spacing.lg },
  });
}
