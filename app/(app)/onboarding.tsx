import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useSettings, useSupabaseCrud } from '@/hooks/useSupabaseCrud';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Logo } from '@/components/brand/logo';
import { sendEmail } from '@/lib/email';
import { spacing, radius } from '@/lib/theme';
import type { ColorTokens } from '@/lib/theme';
import type { Vehicle, VehicleStatus } from '@/types/database';

type Step = 0 | 1 | 2 | 3 | 4;
const TOTAL_STEPS = 5;

interface VehicleDraft {
  make: string;
  model: string;
  year: string;
  license_plate: string;
}

const EMPTY_VEHICLE: VehicleDraft = {
  make: '',
  model: '',
  year: new Date().getFullYear().toString(),
  license_plate: '',
};

const COUNTRY_OPTIONS = [
  { label: 'Canada', value: 'CA' },
  { label: 'United States', value: 'US' },
];
const CURRENCY_OPTIONS = [
  { label: 'CAD ($)', value: 'CAD' },
  { label: 'USD ($)', value: 'USD' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { tokens, typography } = useTheme();
  const { settings, updateSetting, loading: settingsLoading } = useSettings();
  const vehicles = useSupabaseCrud<Vehicle>('vehicles', { orderBy: 'created_at' });
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  const [step, setStep] = useState<Step>(0);
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState('CA');
  const [currency, setCurrency] = useState('CAD');
  const [vehicle, setVehicle] = useState<VehicleDraft>(EMPTY_VEHICLE);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [welcomeSent, setWelcomeSent] = useState(false);

  // Pre-populate from existing settings if user re-enters onboarding.
  useEffect(() => {
    if (!settingsLoading) {
      if (settings.business_name) setBusinessName(settings.business_name);
      if (settings.country) setCountry(settings.country);
      if (settings.currency) setCurrency(settings.currency);
    }
  }, [settingsLoading]);

  // Send a welcome email once when onboarding starts.
  useEffect(() => {
    if (!welcomeSent && user?.email) {
      setWelcomeSent(true);
      sendEmail({
        to: user.email,
        template: 'welcome',
        data: {
          name: (user.user_metadata?.full_name as string) ?? '',
        },
      }).catch(() => {
        // best-effort; don't block onboarding if email fails
      });
    }
  }, [welcomeSent, user]);

  const next = () => setStep((s) => (Math.min(s + 1, TOTAL_STEPS - 1) as Step));
  const back = () => setStep((s) => (Math.max(s - 1, 0) as Step));

  const saveBusiness = async () => {
    if (businessName.trim()) await updateSetting('business_name', businessName.trim());
    if (country) await updateSetting('country', country);
    if (currency) await updateSetting('currency', currency);
    next();
  };

  const saveVehicle = async () => {
    if (!vehicle.make.trim() || !vehicle.model.trim()) {
      next();
      return;
    }
    setSavingVehicle(true);
    const yearNum = parseInt(vehicle.year, 10);
    await vehicles.create({
      make: vehicle.make.trim(),
      model: vehicle.model.trim(),
      year: Number.isFinite(yearNum) ? yearNum : new Date().getFullYear(),
      license_plate: vehicle.license_plate.trim() || null,
      status: 'available' as VehicleStatus,
      vin: null,
      color: null,
      purchase_price: null,
      purchase_date: null,
      insurance_monthly: null,
      financing_monthly: null,
      turo_listing_url: null,
      daily_rate: null,
      retirement_date: null,
      retirement_km: null,
      current_odometer: null,
      notes: null,
      image_url: null,
    });
    setSavingVehicle(false);
    next();
  };

  const finish = async () => {
    setFinishing(true);
    await updateSetting('onboarding_complete', 'true');
    router.replace('/(app)' as any);
  };

  const skipAll = async () => {
    setFinishing(true);
    await updateSetting('onboarding_complete', 'true');
    router.replace('/(app)' as any);
  };

  if (settingsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={tokens.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.topBar}>
          <Logo size="sm" />
          <Pressable onPress={skipAll} hitSlop={8}>
            <Text style={styles.skipAll}>Skip for now</Text>
          </Pressable>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((step + 1) / TOTAL_STEPS) * 100}%`, backgroundColor: tokens.primary },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.stepIndicator}>
              Step {step + 1} of {TOTAL_STEPS}
            </Text>

            {step === 0 ? (
              <WelcomeStep tokens={tokens} typography={typography} userName={user?.user_metadata?.full_name as string} />
            ) : null}

            {step === 1 ? (
              <BusinessStep
                tokens={tokens}
                typography={typography}
                businessName={businessName}
                setBusinessName={setBusinessName}
                country={country}
                setCountry={setCountry}
                currency={currency}
                setCurrency={setCurrency}
              />
            ) : null}

            {step === 2 ? (
              <VehicleStep
                tokens={tokens}
                typography={typography}
                vehicle={vehicle}
                setVehicle={setVehicle}
              />
            ) : null}

            {step === 3 ? <ImportStep tokens={tokens} typography={typography} /> : null}

            {step === 4 ? (
              <DoneStep tokens={tokens} typography={typography} businessName={businessName} />
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 ? (
            <Button title="Back" variant="outline" onPress={back} />
          ) : (
            <View />
          )}

          {step === 0 ? (
            <Button title="Get started" onPress={next} icon={<Ionicons name="arrow-forward" size={16} color={tokens.white} />} />
          ) : null}
          {step === 1 ? <Button title="Continue" onPress={saveBusiness} /> : null}
          {step === 2 ? (
            <Button
              title={vehicle.make && vehicle.model ? 'Add vehicle' : 'Skip for now'}
              onPress={saveVehicle}
              loading={savingVehicle}
              variant={vehicle.make && vehicle.model ? 'primary' : 'outline'}
            />
          ) : null}
          {step === 3 ? (
            <View style={styles.footerActions}>
              <Button
                title="Import later"
                variant="outline"
                onPress={next}
              />
              <Button
                title="Open import"
                onPress={async () => {
                  await updateSetting('onboarding_complete', 'true');
                  router.replace('/(app)/trips' as any);
                }}
                icon={<Ionicons name="cloud-upload-outline" size={14} color={tokens.white} />}
              />
            </View>
          ) : null}
          {step === 4 ? (
            <Button
              title="Open dashboard"
              onPress={finish}
              loading={finishing}
              icon={<Ionicons name="rocket" size={16} color={tokens.white} />}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

interface StepProps {
  tokens: ColorTokens;
  typography: ReturnType<typeof import('@/lib/theme').makeTypography>;
}

function WelcomeStep({ tokens, typography, userName }: StepProps & { userName?: string }) {
  const styles = makeStyles(tokens, typography);
  return (
    <View style={styles.stepBody}>
      <View style={[styles.heroIcon, { backgroundColor: tokens.primaryMuted }]}>
        <Ionicons name="sparkles" size={32} color={tokens.primary} />
      </View>
      <Text style={styles.heading}>Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!</Text>
      <Text style={styles.subheading}>
        Let's set up Overflow Rentals so you can run your Turo fleet like a real
        business. Takes about 2 minutes — and you can skip any step.
      </Text>
      <View style={styles.bulletList}>
        {[
          { icon: 'briefcase-outline' as const, text: 'Tell us about your business' },
          { icon: 'car-outline' as const, text: 'Add your first vehicle' },
          { icon: 'cloud-upload-outline' as const, text: 'Import your existing trips' },
          { icon: 'rocket-outline' as const, text: "You're done — start tracking" },
        ].map((b, i) => (
          <View key={i} style={styles.bullet}>
            <View style={[styles.bulletDot, { backgroundColor: tokens.primaryMuted }]}>
              <Ionicons name={b.icon} size={14} color={tokens.primary} />
            </View>
            <Text style={styles.bulletText}>{b.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BusinessStep({
  tokens,
  typography,
  businessName,
  setBusinessName,
  country,
  setCountry,
  currency,
  setCurrency,
}: StepProps & {
  businessName: string;
  setBusinessName: (s: string) => void;
  country: string;
  setCountry: (s: string) => void;
  currency: string;
  setCurrency: (s: string) => void;
}) {
  const styles = makeStyles(tokens, typography);
  return (
    <View style={styles.stepBody}>
      <View style={[styles.heroIcon, { backgroundColor: tokens.primaryMuted }]}>
        <Ionicons name="briefcase" size={28} color={tokens.primary} />
      </View>
      <Text style={styles.heading}>Your business</Text>
      <Text style={styles.subheading}>
        Used on reports and tax exports. You can change all of these later in
        Settings.
      </Text>
      <View style={styles.formStack}>
        <Input
          label="Business name"
          placeholder="My Car Rental Co."
          value={businessName}
          onChangeText={setBusinessName}
          autoFocus
        />
        <Select label="Country" options={COUNTRY_OPTIONS} value={country} onValueChange={setCountry} />
        <Select label="Currency" options={CURRENCY_OPTIONS} value={currency} onValueChange={setCurrency} />
      </View>
    </View>
  );
}

function VehicleStep({
  tokens,
  typography,
  vehicle,
  setVehicle,
}: StepProps & {
  vehicle: VehicleDraft;
  setVehicle: React.Dispatch<React.SetStateAction<VehicleDraft>>;
}) {
  const styles = makeStyles(tokens, typography);
  return (
    <View style={styles.stepBody}>
      <View style={[styles.heroIcon, { backgroundColor: tokens.primaryMuted }]}>
        <Ionicons name="car-sport" size={28} color={tokens.primary} />
      </View>
      <Text style={styles.heading}>Add your first vehicle</Text>
      <Text style={styles.subheading}>
        Optional — you can skip this and add cars later. We'll use this to scope
        expenses, mileage, and earnings per car.
      </Text>
      <View style={styles.formStack}>
        <View style={styles.formRow}>
          <Input
            label="Make"
            placeholder="Toyota"
            value={vehicle.make}
            onChangeText={(v) => setVehicle((s) => ({ ...s, make: v }))}
            containerStyle={{ flex: 1 }}
          />
          <Input
            label="Model"
            placeholder="Camry"
            value={vehicle.model}
            onChangeText={(v) => setVehicle((s) => ({ ...s, model: v }))}
            containerStyle={{ flex: 1 }}
          />
        </View>
        <View style={styles.formRow}>
          <Input
            label="Year"
            placeholder="2024"
            keyboardType="numeric"
            value={vehicle.year}
            onChangeText={(v) => setVehicle((s) => ({ ...s, year: v }))}
            containerStyle={{ flex: 1 }}
          />
          <Input
            label="License plate"
            placeholder="ABC123"
            value={vehicle.license_plate}
            onChangeText={(v) => setVehicle((s) => ({ ...s, license_plate: v }))}
            containerStyle={{ flex: 1 }}
          />
        </View>
      </View>
    </View>
  );
}

function ImportStep({ tokens, typography }: StepProps) {
  const styles = makeStyles(tokens, typography);
  return (
    <View style={styles.stepBody}>
      <View style={[styles.heroIcon, { backgroundColor: tokens.primaryMuted }]}>
        <Ionicons name="cloud-upload" size={28} color={tokens.primary} />
      </View>
      <Text style={styles.heading}>Import your Turo trips</Text>
      <Text style={styles.subheading}>
        Got historical data on Turo? Export your trips as a CSV from
        turo.com/host/earnings and upload the file — we parse the column
        headers automatically and clean up vehicle names.
      </Text>
      <View style={[styles.calloutBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <Ionicons name="information-circle" size={18} color={tokens.info} />
        <Text style={[styles.calloutText, { color: tokens.textSecondary }]}>
          The Trips screen has both <Text style={{ fontWeight: '600' }}>Upload CSV</Text> and{' '}
          <Text style={{ fontWeight: '600' }}>Paste CSV</Text> options. We strip the owner-name
          prefix Turo adds (e.g. "John's Tesla" → "Tesla").
        </Text>
      </View>
    </View>
  );
}

function DoneStep({
  tokens,
  typography,
  businessName,
}: StepProps & { businessName: string }) {
  const styles = makeStyles(tokens, typography);
  return (
    <View style={styles.stepBody}>
      <View style={[styles.heroIcon, { backgroundColor: tokens.successMuted }]}>
        <Ionicons name="checkmark-circle" size={36} color={tokens.success} />
      </View>
      <Text style={styles.heading}>You're all set</Text>
      <Text style={styles.subheading}>
        {businessName.trim()
          ? `${businessName.trim()} is ready to go. `
          : ''}
        We sent a welcome email with a quick-start guide. Open the dashboard to
        see your fleet at a glance.
      </Text>
      <View style={styles.bulletList}>
        {[
          'Track expenses and revenue per car',
          'Get reminders before maintenance is due',
          'Generate P&L and tax reports anytime',
        ].map((line, i) => (
          <View key={i} style={styles.bullet}>
            <Ionicons name="checkmark" size={16} color={tokens.success} />
            <Text style={styles.bulletText}>{line}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(
  c: ColorTokens,
  typography: ReturnType<typeof import('@/lib/theme').makeTypography>,
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    skipAll: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textMuted,
    },
    progressTrack: {
      height: 3,
      backgroundColor: c.surface,
      marginHorizontal: spacing.lg,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
    },
    scrollContent: {
      flexGrow: 1,
      padding: spacing.lg,
      justifyContent: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 520,
      alignSelf: 'center',
      backgroundColor: c.backgroundCard,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.lg,
    },
    stepIndicator: {
      ...typography.caption,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    stepBody: {
      gap: spacing.md,
      alignItems: 'flex-start',
    },
    heroIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    heading: { ...typography.heading2, color: c.text },
    subheading: { ...typography.bodySmall, color: c.textSecondary, marginBottom: spacing.sm },
    formStack: { gap: spacing.md, alignSelf: 'stretch' },
    formRow: { flexDirection: 'row', gap: spacing.md },
    bulletList: { gap: spacing.sm, marginTop: spacing.sm, alignSelf: 'stretch' },
    bullet: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    bulletDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bulletText: { ...typography.body, color: c.text, flex: 1 },
    calloutBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      alignSelf: 'stretch',
    },
    calloutText: {
      ...typography.bodySmall,
      flex: 1,
      lineHeight: 20,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.background,
      gap: spacing.md,
    },
    footerActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  });
}
