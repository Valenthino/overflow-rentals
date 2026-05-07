import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSupabaseCrud } from '@/hooks/useSupabaseCrud';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { KpiCard } from '@/components/charts/kpi-card';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { formatDate, formatCurrency, formatPercent } from '@/lib/utils';
import type { Claim, ClaimStatus, ClaimCategory, Vehicle } from '@/types/database';

const CATEGORY_OPTIONS: { label: string; value: ClaimCategory }[] = [
  { label: 'Body Damage', value: 'body_damage' },
  { label: 'Interior Damage', value: 'interior_damage' },
  { label: 'Windshield', value: 'windshield' },
  { label: 'Tire / Wheel', value: 'tire_wheel' },
  { label: 'Mechanical', value: 'mechanical' },
  { label: 'Theft', value: 'theft' },
  { label: 'Total Loss', value: 'total_loss' },
  { label: 'Smoking', value: 'smoking' },
  { label: 'Pet Damage', value: 'pet_damage' },
  { label: 'Excessive Miles', value: 'excessive_miles' },
  { label: 'Late Return', value: 'late_return' },
  { label: 'Toll Violation', value: 'toll_violation' },
  { label: 'Parking Ticket', value: 'parking_ticket' },
  { label: 'Other', value: 'other' },
];

const STATUS_OPTIONS: { label: string; value: ClaimStatus }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Denied', value: 'denied' },
  { label: 'Paid', value: 'paid' },
  { label: 'Appealed', value: 'appealed' },
  { label: 'Closed', value: 'closed' },
];

const STATUS_BADGE: Record<ClaimStatus, 'warning' | 'info' | 'purple' | 'success' | 'danger' | 'default'> = {
  open: 'warning',
  submitted: 'info',
  under_review: 'purple',
  approved: 'success',
  denied: 'danger',
  paid: 'success',
  appealed: 'warning',
  closed: 'default',
};

const CATEGORY_ICON: Record<ClaimCategory, React.ComponentProps<typeof Ionicons>['name']> = {
  body_damage: 'car-outline',
  interior_damage: 'color-palette-outline',
  windshield: 'scan-outline',
  tire_wheel: 'ellipse-outline',
  mechanical: 'build-outline',
  theft: 'lock-open-outline',
  total_loss: 'alert-circle-outline',
  smoking: 'cloud-outline',
  pet_damage: 'paw-outline',
  excessive_miles: 'speedometer-outline',
  late_return: 'time-outline',
  toll_violation: 'receipt-outline',
  parking_ticket: 'ticket-outline',
  other: 'help-circle-outline',
};

export default function ClaimsScreen() {
  const { data: claims, loading, refresh, create, update, remove } =
    useSupabaseCrud<Claim>('claims', { orderBy: 'created_at', ascending: false });
  const { data: vehicles } = useSupabaseCrud<Vehicle>('vehicles');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Claim | null>(null);
  const [form, setForm] = useState({
    vehicle_id: '',
    vehicle_name: '',
    trip_id: '',
    renter_name: '',
    category: 'body_damage' as ClaimCategory,
    status: 'open' as ClaimStatus,
    incident_date: '',
    description: '',
    claimed_amount: '',
    received_amount: '',
    insurance_claim_number: '',
    is_insurance_claim: false,
    resolution_date: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      vehicle_id: '',
      vehicle_name: '',
      trip_id: '',
      renter_name: '',
      category: 'body_damage',
      status: 'open',
      incident_date: '',
      description: '',
      claimed_amount: '',
      received_amount: '',
      insurance_claim_number: '',
      is_insurance_claim: false,
      resolution_date: '',
      notes: '',
    });
    setEditing(null);
  };

  const openEdit = (c: Claim) => {
    setEditing(c);
    setForm({
      vehicle_id: c.vehicle_id || '',
      vehicle_name: c.vehicle_name || '',
      trip_id: c.trip_id || '',
      renter_name: c.renter_name || '',
      category: c.category,
      status: c.status,
      incident_date: c.incident_date || '',
      description: c.description || '',
      claimed_amount: c.claimed_amount?.toString() || '',
      received_amount: c.received_amount?.toString() || '',
      insurance_claim_number: c.insurance_claim_number || '',
      is_insurance_claim: c.is_insurance_claim,
      resolution_date: c.resolution_date || '',
      notes: c.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const vehicle = vehicles.find((v) => v.id === form.vehicle_id);
    const payload = {
      vehicle_id: form.vehicle_id || null,
      vehicle_name: vehicle
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : form.vehicle_name || null,
      trip_id: form.trip_id || null,
      renter_name: form.renter_name || null,
      category: form.category,
      status: form.status,
      incident_date: form.incident_date || null,
      description: form.description || null,
      claimed_amount: form.claimed_amount ? parseFloat(form.claimed_amount) : 0,
      received_amount: form.received_amount ? parseFloat(form.received_amount) : 0,
      insurance_claim_number: form.insurance_claim_number || null,
      is_insurance_claim: form.is_insurance_claim,
      resolution_date: form.resolution_date || null,
      notes: form.notes || null,
    };

    if (editing) {
      await update(editing.id, payload);
    } else {
      await create(payload);
    }
    setShowModal(false);
    resetForm();
  };

  const kpis = useMemo(() => {
    const totalClaims = claims.length;
    const totalClaimed = claims.reduce((sum, c) => sum + c.claimed_amount, 0);
    const totalReceived = claims.reduce((sum, c) => sum + c.received_amount, 0);
    const recoveryRate = totalClaimed > 0 ? (totalReceived / totalClaimed) * 100 : 0;
    return { totalClaims, totalClaimed, totalReceived, recoveryRate };
  }, [claims]);

  const getCategoryLabel = (cat: ClaimCategory) =>
    CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? cat;

  const activeClaims = claims.filter((c) =>
    ['open', 'submitted', 'under_review', 'appealed'].includes(c.status)
  );
  const resolvedClaims = claims.filter((c) =>
    ['approved', 'denied', 'paid', 'closed'].includes(c.status)
  );

  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        <ScreenHeader
          title="Claims"
          subtitle={`${activeClaims.length} active`}
          action={
            <Button
              title="New Claim"
              onPress={() => {
                resetForm();
                setShowModal(true);
              }}
              size="sm"
              icon={<Ionicons name="add" size={16} color={colors.white} />}
            />
          }
        />

        {/* KPI Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiRow}
        >
          <KpiCard
            label="Total Claims"
            value={kpis.totalClaims.toString()}
            icon="document-text-outline"
            iconColor={colors.info}
            style={styles.kpiCard}
          />
          <KpiCard
            label="Total Claimed"
            value={formatCurrency(kpis.totalClaimed)}
            icon="trending-up-outline"
            iconColor={colors.warning}
            style={styles.kpiCard}
          />
          <KpiCard
            label="Total Received"
            value={formatCurrency(kpis.totalReceived)}
            icon="checkmark-circle-outline"
            iconColor={colors.success}
            style={styles.kpiCard}
          />
          <KpiCard
            label="Recovery Rate"
            value={formatPercent(kpis.recoveryRate)}
            icon="analytics-outline"
            iconColor={colors.primary}
            style={styles.kpiCard}
          />
        </ScrollView>

        {/* Claims List */}
        {claims.length === 0 && !loading ? (
          <EmptyState
            icon="shield-checkmark-outline"
            title="No claims"
            description="Track damage claims and insurance recoveries here"
            actionLabel="New Claim"
            onAction={() => {
              resetForm();
              setShowModal(true);
            }}
          />
        ) : (
          <>
            {/* Active Claims */}
            {activeClaims.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Claims</Text>
                <View style={styles.cardGrid}>
                  {activeClaims.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      activeOpacity={0.7}
                      onPress={() => openEdit(c)}
                    >
                      <Card>
                        <CardContent style={{ paddingTop: spacing.lg }}>
                          <View style={styles.claimHeader}>
                            <View style={styles.claimCategoryRow}>
                              <View
                                style={[
                                  styles.claimIcon,
                                  { backgroundColor: colors.primaryMuted },
                                ]}
                              >
                                <Ionicons
                                  name={CATEGORY_ICON[c.category]}
                                  size={18}
                                  color={colors.primary}
                                />
                              </View>
                              <Text style={styles.claimCategory}>
                                {getCategoryLabel(c.category)}
                              </Text>
                            </View>
                            <Badge
                              label={c.status.replace('_', ' ')}
                              variant={STATUS_BADGE[c.status]}
                            />
                          </View>
                          <Text style={styles.claimVehicle}>
                            {c.vehicle_name || 'No vehicle'}
                          </Text>
                          {c.renter_name && (
                            <Text style={styles.claimRenter}>
                              Renter: {c.renter_name}
                            </Text>
                          )}
                          {c.description && (
                            <Text style={styles.claimDescription} numberOfLines={2}>
                              {c.description}
                            </Text>
                          )}
                          <View style={styles.claimAmounts}>
                            <View>
                              <Text style={styles.amountLabel}>Claimed</Text>
                              <Text style={styles.amountValue}>
                                {formatCurrency(c.claimed_amount)}
                              </Text>
                            </View>
                            <Ionicons
                              name="arrow-forward"
                              size={14}
                              color={colors.textMuted}
                            />
                            <View>
                              <Text style={styles.amountLabel}>Received</Text>
                              <Text
                                style={[
                                  styles.amountValue,
                                  {
                                    color:
                                      c.received_amount > 0
                                        ? colors.success
                                        : colors.textMuted,
                                  },
                                ]}
                              >
                                {formatCurrency(c.received_amount)}
                              </Text>
                            </View>
                            {c.is_insurance_claim && (
                              <Badge
                                label="Insurance"
                                variant="info"
                                style={{ marginLeft: 'auto' }}
                              />
                            )}
                          </View>
                          {c.incident_date && (
                            <Text style={styles.claimDate}>
                              Incident: {formatDate(c.incident_date, 'MMM d, yyyy')}
                            </Text>
                          )}
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => remove(c.id)}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={14}
                              color={colors.danger}
                            />
                          </TouchableOpacity>
                        </CardContent>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Resolved Claims */}
            {resolvedClaims.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resolved Claims</Text>
                {resolvedClaims.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    activeOpacity={0.7}
                    onPress={() => openEdit(c)}
                  >
                    <View style={styles.listRow}>
                      <View
                        style={[
                          styles.listIcon,
                          { backgroundColor: `${colors.textMuted}18` },
                        ]}
                      >
                        <Ionicons
                          name={CATEGORY_ICON[c.category]}
                          size={16}
                          color={colors.textMuted}
                        />
                      </View>
                      <View style={styles.listInfo}>
                        <Text style={styles.listName}>
                          {getCategoryLabel(c.category)} - {c.vehicle_name || 'Unknown'}
                        </Text>
                        <Text style={styles.listSub}>
                          {c.renter_name || 'N/A'}
                          {' '}
                          {c.incident_date
                            ? `· ${formatDate(c.incident_date, 'MMM d')}`
                            : ''}
                          {' '}
                          · {formatCurrency(c.claimed_amount)}
                          {c.received_amount > 0
                            ? ` → ${formatCurrency(c.received_amount)}`
                            : ''}
                        </Text>
                      </View>
                      <Badge
                        label={c.status.replace('_', ' ')}
                        variant={STATUS_BADGE[c.status]}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editing ? 'Edit Claim' : 'New Claim'}
        size="lg"
      >
        <Select
          label="Vehicle"
          placeholder="Select vehicle"
          options={[
            { label: 'None', value: '' },
            ...vehicles.map((v) => ({
              label: `${v.year} ${v.make} ${v.model}`,
              value: v.id,
            })),
          ]}
          value={form.vehicle_id}
          onValueChange={(v) => setForm({ ...form, vehicle_id: v })}
        />
        <View style={styles.formRow}>
          <Input
            label="Renter Name"
            placeholder="Guest name"
            value={form.renter_name}
            onChangeText={(v) => setForm({ ...form, renter_name: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Trip ID"
            placeholder="Trip reference"
            value={form.trip_id}
            onChangeText={(v) => setForm({ ...form, trip_id: v })}
            containerStyle={styles.formHalf}
          />
        </View>
        <View style={styles.formRow}>
          <Select
            label="Category"
            placeholder="Select category"
            options={CATEGORY_OPTIONS}
            value={form.category}
            onValueChange={(v) =>
              setForm({ ...form, category: v as ClaimCategory })
            }
            containerStyle={styles.formHalf}
          />
          <Select
            label="Status"
            placeholder="Select status"
            options={STATUS_OPTIONS}
            value={form.status}
            onValueChange={(v) =>
              setForm({ ...form, status: v as ClaimStatus })
            }
            containerStyle={styles.formHalf}
          />
        </View>
        <Input
          label="Incident Date"
          placeholder="YYYY-MM-DD"
          value={form.incident_date}
          onChangeText={(v) => setForm({ ...form, incident_date: v })}
        />
        <Input
          label="Description"
          placeholder="Describe the incident"
          multiline
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
          style={{ height: 80, textAlignVertical: 'top' }}
        />
        <View style={styles.formRow}>
          <Input
            label="Claimed Amount ($)"
            placeholder="0.00"
            keyboardType="numeric"
            value={form.claimed_amount}
            onChangeText={(v) => setForm({ ...form, claimed_amount: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Received Amount ($)"
            placeholder="0.00"
            keyboardType="numeric"
            value={form.received_amount}
            onChangeText={(v) => setForm({ ...form, received_amount: v })}
            containerStyle={styles.formHalf}
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Insurance Claim</Text>
            <Text style={styles.toggleHelper}>
              Filed through insurance provider
            </Text>
          </View>
          <Switch
            value={form.is_insurance_claim}
            onValueChange={(v) =>
              setForm({ ...form, is_insurance_claim: v })
            }
            trackColor={{ false: colors.surface, true: colors.primaryMuted }}
            thumbColor={
              form.is_insurance_claim ? colors.primary : colors.textMuted
            }
          />
        </View>
        {form.is_insurance_claim && (
          <Input
            label="Insurance Claim Number"
            placeholder="Claim #"
            value={form.insurance_claim_number}
            onChangeText={(v) =>
              setForm({ ...form, insurance_claim_number: v })
            }
          />
        )}
        <Input
          label="Resolution Date"
          placeholder="YYYY-MM-DD"
          value={form.resolution_date}
          onChangeText={(v) => setForm({ ...form, resolution_date: v })}
        />
        <Input
          label="Notes"
          placeholder="Additional notes"
          multiline
          value={form.notes}
          onChangeText={(v) => setForm({ ...form, notes: v })}
          style={{ height: 60, textAlignVertical: 'top' }}
        />
        <View style={styles.formActions}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => {
              setShowModal(false);
              resetForm();
            }}
          />
          <Button
            title={editing ? 'Save Changes' : 'Submit Claim'}
            onPress={handleSave}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },
  kpiRow: { gap: spacing.md, paddingBottom: spacing.xl },
  kpiCard: { minWidth: 155 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.heading3, marginBottom: spacing.md },
  cardGrid: { gap: spacing.md },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  claimCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  claimIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  claimVehicle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  claimRenter: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  claimDescription: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  claimAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  amountLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  claimDate: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  deleteBtn: {
    position: 'absolute',
    top: spacing.lg,
    right: 0,
    padding: spacing.xs,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: { flex: 1 },
  listName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  listSub: {
    ...typography.caption,
    marginTop: 2,
  },
  formRow: { flexDirection: 'row', gap: spacing.md },
  formHalf: { flex: 1 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: {
    ...typography.label,
    color: colors.text,
  },
  toggleHelper: {
    ...typography.caption,
    marginTop: 2,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
