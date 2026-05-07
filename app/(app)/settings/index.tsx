import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  RefreshControl,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/hooks/useSupabaseCrud';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';

const COUNTRY_OPTIONS = [
  { label: 'Canada', value: 'CA' },
  { label: 'United States', value: 'US' },
];

const CURRENCY_OPTIONS = [
  { label: 'CAD ($)', value: 'CAD' },
  { label: 'USD ($)', value: 'USD' },
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
  const { settings, loading, updateSetting, refresh } = useSettings();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Local state for text inputs so we can save on blur
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [signingOut, setSigningOut] = useState(false);

  // Get the current display value: local override (while editing) or saved setting
  const getValue = useCallback(
    (key: string, fallback = '') => {
      if (key in localValues) return localValues[key];
      return settings[key] ?? fallback;
    },
    [settings, localValues],
  );

  // Track local edits
  const onChangeLocal = (key: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  // Save on blur and clear local override
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

  // For select fields, save immediately
  const onSelectChange = (key: string, value: string) => {
    updateSetting(key, value);
  };

  // For toggle fields, save immediately
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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <ScreenHeader title="Settings" subtitle="Manage your business preferences" />

        <View style={[styles.cardsContainer, isDesktop && styles.cardsContainerDesktop]}>
          {/* Business Info */}
          <Card style={styles.settingsCard}>
            <CardHeader title="Business Info" subtitle="Your company details" />
            <CardContent style={styles.cardBody}>
              <Input
                label="Business Name"
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

          {/* Tax Configuration */}
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

              {/* GST Registered toggle */}
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
                  trackColor={{ false: colors.surface, true: colors.primaryMuted }}
                  thumbColor={
                    settings.gst_registered === 'true' ? colors.primary : colors.textMuted
                  }
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

          {/* Preferences */}
          <Card style={styles.settingsCard}>
            <CardHeader title="Preferences" subtitle="Regional and display settings" />
            <CardContent style={styles.cardBody}>
              <Select
                label="Currency"
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
                label="Timezone"
                options={TIMEZONE_OPTIONS}
                value={settings.timezone ?? 'America/New_York'}
                onValueChange={(v) => onSelectChange('timezone', v)}
              />
            </CardContent>
          </Card>

          {/* Account */}
          <Card style={styles.settingsCard}>
            <CardHeader title="Account" subtitle="Your login and session" />
            <CardContent style={styles.cardBody}>
              <View style={styles.accountRow}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountEmail}>{user?.email ?? 'Not signed in'}</Text>
                  <Text style={styles.accountMeta}>
                    Member since{' '}
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Button
                title="Sign Out"
                variant="destructive"
                onPress={handleSignOut}
                loading={signingOut}
                fullWidth
                icon={<Ionicons name="log-out-outline" size={16} color={colors.white} />}
              />
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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

  // Cards layout
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

  // Form
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formHalf: {
    flex: 1,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textMuted,
  },

  // Account
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  accountMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
