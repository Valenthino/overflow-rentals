import React, { useState, useMemo } from 'react';
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
import { confirmDelete } from '@/lib/confirm';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import type { Vehicle, VehicleStatus } from '@/types/database';

const STATUS_OPTIONS = [
  { label: 'Available', value: 'available' },
  { label: 'Rented', value: 'rented' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Retired', value: 'retired' },
];

const STATUS_BADGE: Record<VehicleStatus, 'success' | 'purple' | 'warning' | 'default'> = {
  available: 'success',
  rented: 'purple',
  maintenance: 'warning',
  retired: 'default',
};

export default function FleetScreen() {
  const { data: vehicles, loading, refresh, create, update, remove } = useSupabaseCrud<Vehicle>('vehicles', { orderBy: 'created_at' });
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { tokens: colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({
    make: '', model: '', year: new Date().getFullYear().toString(), vin: '',
    license_plate: '', color: '', status: 'available' as VehicleStatus,
    purchase_price: '', insurance_monthly: '', financing_monthly: '',
    daily_rate: '', current_odometer: '', notes: '',
  });

  const resetForm = () => {
    setForm({
      make: '', model: '', year: new Date().getFullYear().toString(), vin: '',
      license_plate: '', color: '', status: 'available', purchase_price: '',
      insurance_monthly: '', financing_monthly: '', daily_rate: '', current_odometer: '', notes: '',
    });
    setEditingVehicle(null);
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({
      make: v.make, model: v.model, year: v.year.toString(),
      vin: v.vin || '', license_plate: v.license_plate || '', color: v.color || '',
      status: v.status, purchase_price: v.purchase_price?.toString() || '',
      insurance_monthly: v.insurance_monthly?.toString() || '',
      financing_monthly: v.financing_monthly?.toString() || '',
      daily_rate: v.daily_rate?.toString() || '',
      current_odometer: v.current_odometer?.toString() || '', notes: v.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      make: form.make, model: form.model, year: parseInt(form.year) || new Date().getFullYear(),
      vin: form.vin || null, license_plate: form.license_plate || null, color: form.color || null,
      status: form.status, purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      insurance_monthly: form.insurance_monthly ? parseFloat(form.insurance_monthly) : null,
      financing_monthly: form.financing_monthly ? parseFloat(form.financing_monthly) : null,
      daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : null,
      current_odometer: form.current_odometer ? parseInt(form.current_odometer) : null,
      notes: form.notes || null,
    };

    if (editingVehicle) {
      await update(editingVehicle.id, payload);
    } else {
      await create(payload);
    }
    setShowModal(false);
    resetForm();
  };

  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <ScreenHeader
          title="Fleet"
          subtitle={`${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''}`}
          action={
            <Button
              title="Add Vehicle"
              onPress={() => { resetForm(); setShowModal(true); }}
              size="sm"
              icon={<Ionicons name="add" size={16} color={colors.white} />}
            />
          }
        />

        {vehicles.length === 0 && !loading ? (
          <EmptyState
            icon="car-outline"
            title="No vehicles yet"
            description="Add your first vehicle to start tracking your fleet"
            actionLabel="Add Vehicle"
            onAction={() => { resetForm(); setShowModal(true); }}
          />
        ) : (
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {vehicles.map((v) => (
              <TouchableOpacity key={v.id} activeOpacity={0.7} onPress={() => openEdit(v)}>
                <Card style={styles.vehicleCard}>
                  <CardContent style={styles.vehicleContent}>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleIcon}>
                        <Ionicons name="car-sport" size={24} color={colors.primary} />
                      </View>
                      <Badge label={v.status} variant={STATUS_BADGE[v.status]} />
                    </View>
                    <Text style={styles.vehicleName}>{v.year} {v.make} {v.model}</Text>
                    {v.license_plate && (
                      <Text style={styles.vehiclePlate}>{v.license_plate}</Text>
                    )}
                    <View style={styles.vehicleStats}>
                      {v.daily_rate != null && (
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Daily Rate</Text>
                          <Text style={styles.statValue}>{formatCurrency(v.daily_rate)}</Text>
                        </View>
                      )}
                      {v.current_odometer != null && (
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Odometer</Text>
                          <Text style={styles.statValue}>{v.current_odometer.toLocaleString()} km</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={async () => {
                        if (await confirmDelete(`${v.year} ${v.make} ${v.model}`)) remove(v.id);
                      }}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    </TouchableOpacity>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
        size="lg"
      >
        <View style={styles.formRow}>
          <Input label="Make" placeholder="Toyota" value={form.make} onChangeText={(v) => setForm({ ...form, make: v })} containerStyle={styles.formHalf} />
          <Input label="Model" placeholder="Camry" value={form.model} onChangeText={(v) => setForm({ ...form, model: v })} containerStyle={styles.formHalf} />
        </View>
        <View style={styles.formRow}>
          <Input label="Year" placeholder="2024" keyboardType="numeric" value={form.year} onChangeText={(v) => setForm({ ...form, year: v })} containerStyle={styles.formHalf} />
          <Input label="Color" placeholder="White" value={form.color} onChangeText={(v) => setForm({ ...form, color: v })} containerStyle={styles.formHalf} />
        </View>
        <Input label="VIN" placeholder="Vehicle Identification Number" value={form.vin} onChangeText={(v) => setForm({ ...form, vin: v })} />
        <Input label="License Plate" placeholder="ABC 123" value={form.license_plate} onChangeText={(v) => setForm({ ...form, license_plate: v })} />
        <Select label="Status" options={STATUS_OPTIONS} value={form.status} onValueChange={(v) => setForm({ ...form, status: v as VehicleStatus })} />
        <View style={styles.formRow}>
          <Input label="Daily Rate ($)" placeholder="65" keyboardType="numeric" value={form.daily_rate} onChangeText={(v) => setForm({ ...form, daily_rate: v })} containerStyle={styles.formHalf} />
          <Input label="Purchase Price ($)" placeholder="25000" keyboardType="numeric" value={form.purchase_price} onChangeText={(v) => setForm({ ...form, purchase_price: v })} containerStyle={styles.formHalf} />
        </View>
        <View style={styles.formRow}>
          <Input label="Insurance/mo ($)" placeholder="200" keyboardType="numeric" value={form.insurance_monthly} onChangeText={(v) => setForm({ ...form, insurance_monthly: v })} containerStyle={styles.formHalf} />
          <Input label="Financing/mo ($)" placeholder="450" keyboardType="numeric" value={form.financing_monthly} onChangeText={(v) => setForm({ ...form, financing_monthly: v })} containerStyle={styles.formHalf} />
        </View>
        <Input label="Current Odometer" placeholder="45000" keyboardType="numeric" value={form.current_odometer} onChangeText={(v) => setForm({ ...form, current_odometer: v })} />
        <Input label="Notes" placeholder="Any notes about this vehicle" multiline numberOfLines={3} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} style={{ height: 80, textAlignVertical: 'top' }} />
        <View style={styles.formActions}>
          <Button title="Cancel" variant="outline" onPress={() => { setShowModal(false); resetForm(); }} />
          <Button title={editingVehicle ? 'Save Changes' : 'Add Vehicle'} onPress={handleSave} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },
  grid: { gap: spacing.md },
  gridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  vehicleCard: { minWidth: 280 },
  vehicleContent: { paddingTop: spacing.lg },
  vehicleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  vehicleIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  vehicleName: { ...typography.heading3, marginBottom: 2 },
  vehiclePlate: { ...typography.caption, marginBottom: spacing.md },
  vehicleStats: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm },
  stat: {},
  statLabel: { ...typography.caption, marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  deleteBtn: { position: 'absolute', top: spacing.lg, right: 0, padding: spacing.xs },
  formRow: { flexDirection: 'row', gap: spacing.md },
  formHalf: { flex: 1 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },
  });
}
