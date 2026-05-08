import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  RefreshControl,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettings } from '@/hooks/useSupabaseCrud';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CommunityCard } from '@/components/shared/community-card';
import { spacing, radius } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useLocale, useT } from '@/providers/LocaleProvider';
import type { ColorTokens, ThemeMode } from '@/lib/theme';
import type { Locale } from '@/lib/i18n';

const COUNTRY_OPTIONS = [
  { label: 'Canada', value: 'CA' },
  { label: 'United States', value: 'US' },
];

const CURRENCY_OPTIONS = [
  { label: 'CAD ($)', value: 'CAD' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
];

const FISCAL_YEAR_OPTIONS = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

const TIMEZONE_OPTIONS = [
  { label: 'Pacific (PT)', value: 'America/Los_Angeles' },
  { label: 'Mountain (MT)', value: 'America/Denver' },
  { label: 'Central (CT)', value: 'America/Chicago' },
  { label: 'Eastern (ET)', value: 'America/New_York' },
  { label: 'Atlantic (AT)', value: 'America/Halifax' },
  { label: 'Newfoundland (NT)', value: 'America/St_Johns' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, loading, updateSetting, refresh } = useSettings();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { tokens, typography, mode, setMode } = useTheme();
  const { locale, setLocale, available } = useLocale();
  const t = useT();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [signingOut, setSigningOut] = useState(false);

  const getValue = useCallback(
    (key: string, fallback = '') => {
      if (key in localValues) return localValues[key];
      return settings[key] ?? fallback;
    },
    [settings, localValues],
  );

  const onChangeLocal = (key: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const onBlurSave = (key: string) => {
    const value = localValues[key];
    if (value !== undefined && value !== settings[key]) {
      updateSetting(key, value);
    }
    setLocalValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onSelectChange = (key: string, value: string) => {
    updateSetting(key, value);
  };

  const onToggleChange = (key: string, value: boolean) => {
    updateSetting(key, value ? 'true' : 'false');
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { mode: 'light', label: t('settings.theme_light'), icon: 'sunny-outline' },
    { mode: 'dark', label: t('settings.theme_dark'), icon: 'moon-outline' },
    { mode: 'system', label: t('settings.theme_system'), icon: 'phone-portrait-outline' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={tokens.primary} />}
      >
        <ScreenHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

        <View style={[styles.cardsContainer, isDesktop && styles.cardsContainerDesktop]}>
          <Card style={styles.settingsCard}>
            <CardHeader title={t('settings.appearance')} subtitle={t('settings.subtitle')} />
            <CardContent style={styles.cardBody}>
              <View>
                <Text style={styles.sectionLabel}>{t('settings.theme')}</Text>
                <View style={styles.segmented}>
                  {themeOptions.map((opt) => {
                    const active = mode === opt.mode;
                    return (
                      <Pressable
                        key={opt.mode}
                        onPress={() => setMode(opt.mode)}
                        style={[styles.segment, active ? styles.segmentActive : null]}
                      >
                        <Ionicons name={opt.icon} size={16} color={active ? tokens.primary : tokens.textMuted} />
                        <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
                <View style={styles.languageGrid}>
                  {available.map((l) => {
                    const active = locale === l.code;
                    return (
                      <Pressable
                        key={l.code}
                        onPress={() => setLocale(l.code as Locale)}
                        style={[styles.languageChip, active ? styles.languageChipActive : null]}
                      >
                        <Text style={[styles.languageChipText, active ? styles.languageChipTextActive : null]}>
                          {l.native}
                        </Text>
                        {active ? <Ionicons name="checkmark" size={14} color={tokens.primary} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </CardContent>
          </Card>

          <Card style={styles.settingsCard}>
            <CardHeader title="Business Info" subtitle="Your company details" />
            <CardContent style={styles.cardBody}>
              <Input
                label={t('settings.business_name')}
                placeholder="My Car Rental Co."
                value={getValue('business_name')}
                onChangeText={(v) => onChangeLocal('business_name', v)}
                onBlur={() => onBlurSave('business_name')}
              />
              <Input
                label="Business Location"
                placeholder="Vancouver, BC"
                value={getValue('business_location')}
                onChangeText={(v) => onChangeLocal('business_location', v)}
                onBlur={() => onBlurSave('business_location')}
              />
            </CardContent>
          </Card>

          <Card style={styles.settingsCard}>
            <CardHeader title="Tax Configuration" subtitle="Tax rates and registration" />
            <CardContent style={styles.cardBody}>
              <Select
                label="Country"
                options={COUNTRY_OPTIONS}
                value={settings.country ?? 'CA'}
                onValueChange={(v) => onSelectChange('country', v)}
              />
              <Input
                label="Province / State"
                placeholder="e.g. BC, ON, CA, NY"
                value={getValue('province_state')}
                onChangeText={(v) => onChangeLocal('province_state', v)}
                onBlur={() => onBlurSave('province_state')}
              />
              <Input
                label="Tax Number"
                placeholder="e.g. GST/HST or EIN"
                value={getValue('tax_number')}
                onChangeText={(v) => onChangeLocal('tax_number', v)}
                onBlur={() => onBlurSave('tax_number')}
              />
              <View style={styles.formRow}>
                <Input
                  label="GST Rate (%)"
                  placeholder="5"
                  keyboardType="numeric"
                  value={getValue('gst_rate')}
                  onChangeText={(v) => onChangeLocal('gst_rate', v)}
                  onBlur={() => onBlurSave('gst_rate')}
                  containerStyle={styles.formHalf}
                />
                <Input
                  label="PST Rate (%)"
                  placeholder="7"
                  keyboardType="numeric"
                  value={getValue('pst_rate')}
                  onChangeText={(v) => onChangeLocal('pst_rate', v)}
                  onBlur={() => onBlurSave('pst_rate')}
                  containerStyle={styles.formHalf}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>GST/HST Registered</Text>
                  <Text style={styles.toggleHelper}>
                    Enable if your business is registered for GST/HST
                  </Text>
                </View>
                <Switch
                  value={settings.gst_registered === 'true'}
                  onValueChange={(v) => onToggleChange('gst_registered', v)}
                  trackColor={{ false: tokens.surface, true: tokens.primaryMuted }}
                  thumbColor={settings.gst_registered === 'true' ? tokens.primary : tokens.textMuted}
                />
              </View>

              <Input
                label="Host Fee (%)"
                placeholder="25"
                keyboardType="numeric"
                value={getValue('host_fee_percent')}
                onChangeText={(v) => onChangeLocal('host_fee_percent', v)}
                onBlur={() => onBlurSave('host_fee_percent')}
                helper="The percentage Turo takes from each trip"
              />
            </CardContent>
          </Card>

          <Card style={styles.settingsCard}>
            <CardHeader title="Preferences" subtitle="Regional and display settings" />
            <CardContent style={styles.cardBody}>
              <Select
                label={t('settings.currency')}
                options={CURRENCY_OPTIONS}
                value={settings.currency ?? 'CAD'}
                onValueChange={(v) => onSelectChange('currency', v)}
              />
              <Select
                label="Fiscal Year Start"
                options={FISCAL_YEAR_OPTIONS}
                value={settings.fiscal_year_start ?? '01'}
                onValueChange={(v) => onSelectChange('fiscal_year_start', v)}
              />
              <Select
                label={t('settings.timezone')}
                options={TIMEZONE_OPTIONS}
                value={settings.timezone ?? 'America/New_York'}
                onValueChange={(v) => onSelectChange('timezone', v)}
              />
            </CardContent>
          </Card>

          <CommunityCard />

          <Card style={styles.settingsCard}>
            <CardHeader title={t('settings.account')} subtitle="Your login and session" />
            <CardContent style={styles.cardBody}>
              <View style={styles.accountRow}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={24} color={tokens.primary} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountEmail}>{user?.email ?? 'Not signed in'}</Text>
                  <Text style={styles.accountMeta}>
                    Member since{' '}
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString(locale, {
                          month: 'short',
                          year: 'numeric',
                        })
                      : '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Button
                title="Replay onboarding"
                variant="outline"
                onPress={async () => {
                  await updateSetting('onboarding_complete', 'false');
                  router.replace('/(app)/onboarding' as any);
                }}
                fullWidth
                icon={<Ionicons name="refresh-outline" size={16} color={tokens.text} />}
              />

              <Button
                title={t('settings.sign_out')}
                variant="destructive"
                onPress={handleSignOut}
                loading={signingOut}
                fullWidth
                icon={<Ionicons name="log-out-outline" size={16} color={tokens.white} />}
              />
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing['5xl'],
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardsContainer: {
      gap: spacing.xl,
    },
    cardsContainerDesktop: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    settingsCard: {
      minWidth: 320,
      flex: 1,
    },
    cardBody: {
      gap: spacing.lg,
    },
    sectionLabel: {
      ...typography.label,
      marginBottom: spacing.sm,
    },
    segmented: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: radius.sm,
    },
    segmentActive: {
      backgroundColor: c.primaryMuted,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textMuted,
    },
    segmentTextActive: {
      color: c.primary,
      fontWeight: '600',
    },
    languageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    languageChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    languageChipActive: {
      backgroundColor: c.primaryMuted,
      borderColor: c.primary,
    },
    languageChipText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textSecondary,
    },
    languageChipTextActive: {
      color: c.primary,
      fontWeight: '600',
    },
    formRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    formHalf: {
      flex: 1,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    toggleInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    toggleLabel: {
      ...typography.label,
      marginBottom: 2,
    },
    toggleHelper: {
      fontSize: 12,
      color: c.textMuted,
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatarCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountInfo: {
      flex: 1,
    },
    accountEmail: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    accountMeta: {
      ...typography.caption,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
    },
  });
}
