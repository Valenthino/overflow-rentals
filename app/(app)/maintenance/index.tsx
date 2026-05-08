import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  RefreshControl,
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
import { spacing, radius } from '@/lib/theme';
import type { ColorTokens } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Maintenance, MaintenanceType, Vehicle } from '@/types/database';

const TYPE_OPTIONS: { label: string; value: MaintenanceType }[] = [
  { label: 'Oil Change', value: 'oil_change' },
  { label: 'Tire Rotation', value: 'tire_rotation' },
  { label: 'Brake Service', value: 'brake_service' },
  { label: 'Battery', value: 'battery' },
  { label: 'Transmission', value: 'transmission' },
  { label: 'Coolant', value: 'coolant' },
  { label: 'Air Filter', value: 'air_filter' },
  { label: 'Cabin Filter', value: 'cabin_filter' },
  { label: 'Spark Plugs', value: 'spark_plugs' },
  { label: 'Alignment', value: 'alignment' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Recall', value: 'recall' },
  { label: 'Other', value: 'other' },
];

const TYPE_LABEL: Record<MaintenanceType, string> = {
  oil_change: 'Oil Change',
  tire_rotation: 'Tire Rotation',
  brake_service: 'Brake Service',
  battery: 'Battery',
  transmission: 'Transmission',
  coolant: 'Coolant',
  air_filter: 'Air Filter',
  cabin_filter: 'Cabin Filter',
  spark_plugs: 'Spark Plugs',
  alignment: 'Alignment',
  inspection: 'Inspection',
  recall: 'Recall',
  other: 'Other',
};

const TYPE_ICON: Record<MaintenanceType, string> = {
  oil_change: 'water-outline',
  tire_rotation: 'ellipse-outline',
  brake_service: 'hand-left-outline',
  battery: 'battery-half-outline',
  transmission: 'cog-outline',
  coolant: 'thermometer-outline',
  air_filter: 'leaf-outline',
  cabin_filter: 'funnel-outline',
  spark_plugs: 'flash-outline',
  alignment: 'resize-outline',
  inspection: 'search-outline',
  recall: 'alert-circle-outline',
  other: 'build-outline',
};

export default function MaintenanceScreen() {
  const { data: records, loading, refresh, create, update, remove } =
    useSupabaseCrud<Maintenance>('maintenance', { orderBy: 'date' });
  const { data: vehicles } = useSupabaseCrud<Vehicle>('vehicles');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { tokens, typography } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Maintenance | null>(null);
  const [form, setForm] = useState({
    vehicle_id: '',
    vehicle_name: '',
    date: '',
    type: 'oil_change' as MaintenanceType,
    description: '',
    vendor: '',
    cost: '',
    odometer: '',
    next_due_date: '',
    next_due_odometer: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      vehicle_id: '',
      vehicle_name: '',
      date: '',
      type: 'oil_change',
      description: '',
      vendor: '',
      cost: '',
      odometer: '',
      next_due_date: '',
      next_due_odometer: '',
      notes: '',
    });
    setEditing(null);
  };

  const openEdit = (m: Maintenance) => {
    setEditing(m);
    setForm({
      vehicle_id: m.vehicle_id || '',
      vehicle_name: m.vehicle_name || '',
      date: m.date || '',
      type: m.type,
      description: m.description || '',
      vendor: m.vendor || '',
      cost: m.cost?.toString() || '',
      odometer: m.odometer?.toString() || '',
      next_due_date: m.next_due_date || '',
      next_due_odometer: m.next_due_odometer?.toString() || '',
      notes: m.notes || '',
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
      date: form.date || new Date().toISOString().split('T')[0],
      type: form.type,
      description: form.description || null,
      vendor: form.vendor || null,
      cost: form.cost ? parseFloat(form.cost) : 0,
      odometer: form.odometer ? parseInt(form.odometer) : null,
      next_due_date: form.next_due_date || null,
      next_due_odometer: form.next_due_odometer
        ? parseInt(form.next_due_odometer)
        : null,
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

  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refresh}
            tintColor={tokens.primary}
          />
        }
      >
        <ScreenHeader
          title="Maintenance"
          subtitle={`${records.length} record${records.length !== 1 ? 's' : ''}${totalCost > 0 ? ` · ${formatCurrency(totalCost)} total` : ''}`}
          action={
            <Button
              title="Add Record"
              onPress={() => {
                resetForm();
                setShowModal(true);
              }}
              size="sm"
              icon={<Ionicons name="add" size={16} color={tokens.white} />}
            />
          }
        />

        {records.length === 0 && !loading ? (
          <EmptyState
            icon="build-outline"
            title="No maintenance records"
            description="Track vehicle maintenance to stay on top of service schedules"
            actionLabel="Add Record"
            onAction={() => {
              resetForm();
              setShowModal(true);
            }}
          />
        ) : (
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {records.map((m) => {
              const isOverdue =
                m.next_due_date &&
                new Date(m.next_due_date) < new Date();
              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.7}
                  onPress={() => openEdit(m)}
                >
                  <Card style={styles.maintenanceCard}>
                    <CardContent style={styles.maintenanceContent}>
                      <View style={styles.maintenanceHeader}>
                        <View style={styles.typeIcon}>
                          <Ionicons
                            name={
                              (TYPE_ICON[m.type] as any) || 'build-outline'
                            }
                            size={24}
                            color={tokens.primary}
                          />
                        </View>
                        <View style={styles.headerBadges}>
                          <Badge
                            label={TYPE_LABEL[m.type] || m.type}
                            variant="purple"
                          />
                          {isOverdue && (
                            <Badge label="Overdue" variant="danger" />
                          )}
                        </View>
                      </View>
                      <Text style={styles.vehicleName}>
                        {m.vehicle_name || 'No vehicle'}
                      </Text>
                      <View style={styles.detailsGrid}>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="calendar-outline"
                            size={13}
                            color={tokens.textMuted}
                          />
                          <Text style={styles.detailText}>
                            {formatDate(m.date)}
                          </Text>
                        </View>
                        {m.vendor && (
                          <View style={styles.detailRow}>
                            <Ionicons
                              name="business-outline"
                              size={13}
                              color={tokens.textMuted}
                            />
                            <Text style={styles.detailText}>{m.vendor}</Text>
                          </View>
                        )}
                        {m.odometer != null && (
                          <View style={styles.detailRow}>
                            <Ionicons
                              name="speedometer-outline"
                              size={13}
                              color={tokens.textMuted}
                            />
                            <Text style={styles.detailText}>
                              {m.odometer.toLocaleString()} km
                            </Text>
                          </View>
                        )}
                      </View>
                      {m.description && (
                        <Text style={styles.descriptionText} numberOfLines={2}>
                          {m.description}
                        </Text>
                      )}
                      <View style={styles.bottomRow}>
                        <View style={styles.costSection}>
                          <Text style={styles.costLabel}>Cost</Text>
                          <Text style={styles.costValue}>
                            {formatCurrency(m.cost)}
                          </Text>
                        </View>
                        {m.next_due_date && (
                          <View style={styles.nextDueSection}>
                            <Text style={styles.nextDueLabel}>Next Due</Text>
                            <Text
                              style={[
                                styles.nextDueValue,
                                isOverdue && styles.nextDueOverdue,
                              ]}
                            >
                              {formatDate(m.next_due_date)}
                            </Text>
                            {m.next_due_odometer != null && (
                              <Text style={styles.nextDueOdo}>
                                or {m.next_due_odometer.toLocaleString()} km
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => remove(m.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color={tokens.danger}
                        />
                      </TouchableOpacity>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editing ? 'Edit Maintenance' : 'Add Maintenance'}
        size="lg"
      >
        <Select
          label="Vehicle"
          placeholder="Select vehicle"
          options={vehicles.map((v) => ({
            label: `${v.year} ${v.make} ${v.model}`,
            value: v.id,
          }))}
          value={form.vehicle_id}
          onValueChange={(v) => setForm({ ...form, vehicle_id: v })}
        />
        <Select
          label="Type"
          options={TYPE_OPTIONS}
          value={form.type}
          onValueChange={(v) =>
            setForm({ ...form, type: v as MaintenanceType })
          }
        />
        <Input
          label="Date"
          placeholder="YYYY-MM-DD"
          value={form.date}
          onChangeText={(v) => setForm({ ...form, date: v })}
        />
        <Input
          label="Description"
          placeholder="What was done"
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
        />
        <View style={styles.formRow}>
          <Input
            label="Vendor"
            placeholder="Shop name"
            value={form.vendor}
            onChangeText={(v) => setForm({ ...form, vendor: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Cost ($)"
            placeholder="150"
            keyboardType="numeric"
            value={form.cost}
            onChangeText={(v) => setForm({ ...form, cost: v })}
            containerStyle={styles.formHalf}
          />
        </View>
        <Input
          label="Odometer (km)"
          placeholder="Current reading"
          keyboardType="numeric"
          value={form.odometer}
          onChangeText={(v) => setForm({ ...form, odometer: v })}
        />
        <View style={styles.formRow}>
          <Input
            label="Next Due Date"
            placeholder="YYYY-MM-DD"
            value={form.next_due_date}
            onChangeText={(v) => setForm({ ...form, next_due_date: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Next Due Odometer"
            placeholder="km reading"
            keyboardType="numeric"
            value={form.next_due_odometer}
            onChangeText={(v) => setForm({ ...form, next_due_odometer: v })}
            containerStyle={styles.formHalf}
          />
        </View>
        <Input
          label="Notes"
          placeholder="Additional notes"
          multiline
          numberOfLines={3}
          value={form.notes}
          onChangeText={(v) => setForm({ ...form, notes: v })}
          style={{ height: 80, textAlignVertical: 'top' }}
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
            title={editing ? 'Save Changes' : 'Add Record'}
            onPress={handleSave}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },
    grid: { gap: spacing.md },
    gridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
    maintenanceCard: { minWidth: 280 },
    maintenanceContent: { paddingTop: spacing.lg },
    maintenanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    typeIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: c.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerBadges: { flexDirection: 'row', gap: spacing.xs },
    vehicleName: { ...typography.heading3, marginBottom: spacing.sm },
    detailsGrid: { gap: 4, marginBottom: spacing.sm },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    detailText: { ...typography.bodySmall },
    descriptionText: {
      ...typography.bodySmall,
      fontStyle: 'italic',
      marginBottom: spacing.sm,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    costSection: {},
    costLabel: { ...typography.caption, marginBottom: 2 },
    costValue: { fontSize: 16, fontWeight: '700', color: c.primary },
    nextDueSection: { alignItems: 'flex-end' },
    nextDueLabel: { ...typography.caption, marginBottom: 2 },
    nextDueValue: { fontSize: 13, fontWeight: '600', color: c.text },
    nextDueOverdue: { color: c.danger },
    nextDueOdo: { ...typography.caption, marginTop: 1 },
    deleteBtn: {
      position: 'absolute',
      top: spacing.lg,
      right: 0,
      padding: spacing.xs,
    },
    formRow: { flexDirection: 'row', gap: spacing.md },
    formHalf: { flex: 1 },
    formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
      marginTop: spacing.md,
    },
  });
}
