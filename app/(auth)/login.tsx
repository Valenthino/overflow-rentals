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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    const result = await signIn(email.trim(), password);
    if (result.error) {
      setError(result.error.message);
    }
    setLoading(false);
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
              <View style={styles.logoIcon}>
                <Ionicons name="car-sport" size={32} color={colors.white} />
              </View>
              <Text style={styles.logoTitle}>Overflow Rentals</Text>
              <Text style={styles.logoSubtitle}>
                Manage your Turo fleet like a pro
              </Text>
            </View>

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
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
              />

              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password' as any)}
                style={styles.forgotBtn}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="lg"
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.footerLink}> Sign Up</Text>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    ...typography.bodySmall,
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
  errorText: {
    color: colors.danger,
    fontSize: 13,
    flex: 1,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['3xl'],
  },
  footerText: {
    ...typography.bodySmall,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
