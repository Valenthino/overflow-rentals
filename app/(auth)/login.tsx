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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, session } = useAuth();
  const { tokens, typography } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) router.replace('/(app)');
  }, [session]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('auth.fill_all_fields'));
      return;
    }
    setLoading(true);
    setError('');
    const result = await signIn(email.trim(), password);
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    }
  };

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
            <View style={styles.logoSection}>
              <Logo size="xl" align="center" />
              <Text style={styles.logoSubtitle}>{t('auth.welcome_subtitle')}</Text>
            </View>

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
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Ionicons name="mail-outline" size={18} color={tokens.textMuted} />}
              />

              <Input
                label={t('auth.password')}
                placeholder={t('auth.password_placeholder')}
                secureTextEntry={!showPassword}
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={tokens.textMuted} />}
                rightIcon={
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={tokens.textMuted}
                    />
                  </Pressable>
                }
              />

              <Pressable
                onPress={() => router.push('/(auth)/forgot-password' as any)}
                style={styles.forgotBtn}
              >
                <Text style={styles.forgotText}>{t('auth.forgot_password')}</Text>
              </Pressable>

              <Button
                title={t('auth.login')}
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="lg"
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.no_account')}</Text>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.footerLink}>{t('auth.signup_cta')}</Text>
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
    logoSection: {
      alignItems: 'center',
      marginBottom: spacing['4xl'],
      gap: spacing.md,
    },
    logoSubtitle: {
      ...typography.bodySmall,
      textAlign: 'center',
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
    forgotBtn: {
      alignSelf: 'flex-end',
      marginTop: -spacing.sm,
    },
    forgotText: {
      color: c.primary,
      fontSize: 13,
      fontWeight: '500',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: spacing['3xl'],
    },
    footerText: { ...typography.bodySmall },
    footerLink: { color: c.primary, fontSize: 13, fontWeight: '600' },
  });
}
