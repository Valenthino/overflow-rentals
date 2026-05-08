import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LocaleProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import { spacing, radius } from '@/lib/theme';
import type { ColorTokens } from '@/lib/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, session } = useAuth();
  const { tokens, typography } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Layout will route new users to /(app)/onboarding when settings.onboarding_complete is missing.
    if (session) router.replace('/(app)');
  }, [session]);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError(t('auth.fill_all_fields'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.password_too_short'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwords_no_match'));
      return;
    }

    setLoading(true);
    setError('');
    const result = await signUp(email.trim(), password, name.trim());
    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={tokens.success} />
          </View>
          <Text style={styles.successTitle}>{t('auth.check_email')}</Text>
          <Text style={styles.successText}>
            {t('auth.check_email_signup', { email })}
          </Text>
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Logo size="lg" align="center" />
              <Text style={styles.title}>{t('auth.create_account')}</Text>
              <Text style={styles.subtitle}>{t('auth.create_account_subtitle')}</Text>
            </View>

            <View style={styles.form}>
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={tokens.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Input
                label={t('auth.full_name')}
                placeholder={t('auth.full_name_placeholder')}
                autoCapitalize="words"
                autoComplete="name"
                value={name}
                onChangeText={setName}
                leftIcon={<Ionicons name="person-outline" size={18} color={tokens.textMuted} />}
              />

              <Input
                label={t('auth.email')}
                placeholder={t('auth.email_placeholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Ionicons name="mail-outline" size={18} color={tokens.textMuted} />}
              />

              <Input
                label={t('auth.password')}
                placeholder={t('auth.password_min')}
                secureTextEntry
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={tokens.textMuted} />}
              />

              <Input
                label={t('auth.confirm_password')}
                placeholder={t('auth.confirm_password_placeholder')}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={tokens.textMuted} />}
              />

              <Button
                title={t('auth.create_account')}
                onPress={handleRegister}
                loading={loading}
                fullWidth
                size="lg"
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.have_account')}</Text>
              <Pressable onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.footerLink}>{t('auth.signin_cta')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center' },
    container: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      padding: spacing.xl,
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      marginBottom: spacing['3xl'],
      alignItems: 'center',
      gap: spacing.md,
    },
    title: {
      ...typography.heading1,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.bodySmall,
      textAlign: 'center',
      marginTop: -spacing.xs,
    },
    form: {
      gap: spacing.lg,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.dangerMuted,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    errorText: { color: c.danger, fontSize: 13, flex: 1 },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: spacing['3xl'],
    },
    footerText: { ...typography.bodySmall },
    footerLink: { color: c.primary, fontSize: 13, fontWeight: '600' },
    successIcon: { marginBottom: spacing.lg },
    successTitle: { ...typography.heading2, textAlign: 'center', marginBottom: spacing.sm },
    successText: { ...typography.bodySmall, textAlign: 'center', maxWidth: 320 },
  });
}
