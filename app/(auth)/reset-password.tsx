import React, { useMemo, useState } from 'react';
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword, endRecoveryMode } = useAuth();
  const { tokens, typography } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleUpdate = async () => {
    if (!password || !confirmPassword) {
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
    const result = await updatePassword(password);
    if (result.error) {
      setError(result.error.message);
    } else {
      setDone(true);
    }
    setLoading(false);
  };

  const finish = () => {
    endRecoveryMode();
    router.replace('/(app)');
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={tokens.success} />
          </View>
          <Text style={styles.title}>{t('auth.password_updated')}</Text>
          <Text style={styles.subtitle}>{t('auth.password_updated_body')}</Text>
          <Button
            title={t('auth.continue')}
            onPress={finish}
            fullWidth
            size="lg"
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
              <Text style={styles.title}>{t('auth.set_new_password')}</Text>
              <Text style={styles.subtitle}>{t('auth.set_new_password_subtitle')}</Text>
            </View>

            <View style={styles.form}>
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={tokens.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Input
                label={t('auth.new_password')}
                placeholder={t('auth.password_min')}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
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

              <Input
                label={t('auth.confirm_password')}
                placeholder={t('auth.confirm_password_placeholder')}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={tokens.textMuted} />}
              />

              <Button
                title={t('auth.update_password')}
                onPress={handleUpdate}
                loading={loading}
                fullWidth
                size="lg"
              />
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
    title: { ...typography.heading1, textAlign: 'center' },
    subtitle: {
      ...typography.bodySmall,
      textAlign: 'center',
      marginTop: -spacing.xs,
    },
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
