import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { colors, spacing, radius, typography } from '@/lib/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email) { setError('Please enter your email'); return; }
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
            <Ionicons name="mail" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a password reset link to {email}
          </Text>
          <Button
            title="Back to Sign In"
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a reset link
        </Text>
        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
          />
          <Button title="Send Reset Link" onPress={handleReset} loading={loading} fullWidth size="lg" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { width: '100%', maxWidth: 400, alignSelf: 'center', padding: spacing.xl, flex: 1, justifyContent: 'center' },
  centered: { alignItems: 'center' },
  backBtn: { marginBottom: spacing.xl },
  title: { ...typography.heading1, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, marginBottom: spacing['3xl'] },
  form: { gap: spacing.lg },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerMuted, borderRadius: radius.md, padding: spacing.md },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  successIcon: { marginBottom: spacing.lg },
});
