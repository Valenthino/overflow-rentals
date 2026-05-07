import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { colors, spacing, radius, typography } from '@/lib/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
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
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successText}>
            We sent a confirmation link to {email}. Click it to activate your account.
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Start managing your Turo fleet today</Text>
            </View>

            <View style={styles.form}>
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Input
                label="Full Name"
                placeholder="John Doe"
                autoCapitalize="words"
                autoComplete="name"
                value={name}
                onChangeText={setName}
                leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
              />

              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
              />

              <Input
                label="Password"
                placeholder="Min 8 characters"
                secureTextEntry
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
              />

              <Input
                label="Confirm Password"
                placeholder="Re-enter password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
              />

              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                fullWidth
                size="lg"
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.footerLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  container: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: spacing.xl,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    marginBottom: spacing['3xl'],
  },
  title: {
    ...typography.heading1,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['3xl'],
  },
  footerText: { ...typography.bodySmall },
  footerLink: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  successIcon: { marginBottom: spacing.lg },
  successTitle: { ...typography.heading2, textAlign: 'center', marginBottom: spacing.sm },
  successText: { ...typography.bodySmall, textAlign: 'center', maxWidth: 300 },
});
