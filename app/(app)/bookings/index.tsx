import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  useWindowDimensions, RefreshControl,
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
import { formatDate, daysRemaining, formatCurrency } from '@/lib/utils';
import type { Booking, BookingStatus, Vehicle } from '@/types/database';

const STATUS_OPTIONS = [
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const BADGE_MAP: Record<BookingStatus, 'info' | 'purple' | 'success' | 'danger' | 'warning'> = {
  confirmed: 'info',
  active: 'purple',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'warning',
};

export default function BookingsScreen() {
  const { data: bookings, loading, refresh, create, update, remove } = useSupabaseCrud<Booking>('bookings', { orderBy: 'pickup_date', ascending: false });
  const { data: vehicles } = useSupabaseCrud<Vehicle>('vehicles');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { tokens: colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState({
    vehicle_id: '', vehicle_name: '', renter_name: '', status: 'confirmed' as BookingStatus,
    pickup_date: '', pickup_time: '', pickup_location: '',
    return_date: '', return_time: '', return_location: '',
    daily_rate: '', notes: '',
  });

  const resetForm = () => {
    setForm({
      vehicle_id: '', vehicle_name: '', renter_name: '', status: 'confirmed',
      pickup_date: '', pickup_time: '', pickup_location: '',
      return_date: '', return_time: '', return_location: '',
      daily_rate: '', notes: '',
    });
    setEditing(null);
  };

  const openEdit = (b: Booking) => {
    setEditing(b);
    setForm({
      vehicle_id: b.vehicle_id || '', vehicle_name: b.vehicle_name || '',
      renter_name: b.renter_name || '', status: b.status,
      pickup_date: b.pickup_date || '', pickup_time: b.pickup_time || '',
      pickup_location: b.pickup_location || '', return_date: b.return_date || '',
      return_time: b.return_time || '', return_location: b.return_location || '',
      daily_rate: b.daily_rate?.toString() || '', notes: b.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const vehicle = vehicles.find((v) => v.id === form.vehicle_id);
    const days = form.pickup_date && form.return_date
      ? Math.ceil((new Date(form.return_date).getTime() - new Date(form.pickup_date).getTime()) / 86400000)
      : 0;
    const rate = form.daily_rate ? parseFloat(form.daily_rate) : 0;

    const payload = {
      vehicle_id: form.vehicle_id || null,
      vehicle_name: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : form.vehicle_name || null,
      renter_name: form.renter_name || null, status: form.status,
      pickup_date: form.pickup_date || null, pickup_time: form.pickup_time || null,
      pickup_location: form.pickup_location || null, return_date: form.return_date || null,
      return_time: form.return_time || null, return_location: form.return_location || null,
      daily_rate: rate || null, total_price: days * rate || null,
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

  const activeBookings = bookings.filter((b) => ['confirmed', 'active'].includes(b.status));
  const pastBookings = bookings.filter((b) => ['completed', 'cancelled', 'no_show'].includes(b.status));

  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <ScreenHeader
          title="Bookings"
          subtitle={`${activeBookings.length} active`}
          action={
            <Button title="New Booking" onPress={() => { resetForm(); setShowModal(true); }} size="sm"
              icon={<Ionicons name="add" size={16} color={colors.white} />} />
          }
        />

        {bookings.length === 0 && !loading ? (
          <EmptyState icon="calendar-outline" title="No bookings" description="Create your first booking to track reservations" actionLabel="New Booking" onAction={() => { resetForm(); setShowModal(true); }} />
        ) : (
          <>
            {activeBookings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active & Upcoming</Text>
                <View style={styles.cardGrid}>
                  {activeBookings.map((b) => {
                    const days = b.return_date ? daysRemaining(b.return_date) : 0;
                    const totalDays = b.pickup_date && b.return_date
                      ? Math.ceil((new Date(b.return_date).getTime() - new Date(b.pickup_date).getTime()) / 86400000) : 1;
                    const progress = totalDays > 0 ? Math.max(0, Math.min(1, 1 - days / totalDays)) : 0;

                    return (
                      <TouchableOpacity key={b.id} activeOpacity={0.7} onPress={() => openEdit(b)}>
                        <Card>
                          <CardContent style={{ paddingTop: spacing.lg }}>
                            <View style={styles.bookingHeader}>
                              <Badge label={b.status} variant={BADGE_MAP[b.status]} />
                              <TouchableOpacity onPress={async () => { if (await confirmDelete(b.vehicle_name || 'this booking')) remove(b.id); }}>
                                <Ionicons name="trash-outline" size={14} color={colors.danger} />
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.bookingVehicle}>{b.vehicle_name || 'No vehicle'}</Text>
                            <Text style={styles.bookingRenter}>{b.renter_name || 'Unknown renter'}</Text>
                            <View style={styles.dateRow}>
                              <View>
                                <Text style={styles.dateLabel}>Pickup</Text>
                                <Text style={styles.dateValue}>{formatDate(b.pickup_date || '', 'MMM d')}</Text>
                              </View>
                              <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                              <View>
                                <Text style={styles.dateLabel}>Return</Text>
                                <Text style={styles.dateValue}>{formatDate(b.return_date || '', 'MMM d')}</Text>
                              </View>
                              {b.total_price != null && (
                                <Text style={styles.priceText}>{formatCurrency(b.total_price)}</Text>
                              )}
                            </View>
                            {b.status === 'active' && (
                              <View style={styles.progressContainer}>
                                <View style={styles.progressBg}>
                                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                                </View>
                                <Text style={styles.progressText}>{Math.max(0, days)}d remaining</Text>
                              </View>
                            )}
                            <View style={styles.checkRow}>
                              <View style={styles.checkItem}>
                                <Ionicons name={b.pre_trip_check ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={b.pre_trip_check ? colors.success : colors.textMuted} />
                                <Text style={styles.checkText}>Pre-trip</Text>
                              </View>
                              <View style={styles.checkItem}>
                                <Ionicons name={b.post_trip_check ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={b.post_trip_check ? colors.success : colors.textMuted} />
                                <Text style={styles.checkText}>Post-trip</Text>
                              </View>
                            </View>
                          </CardContent>
                        </Card>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
            {pastBookings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past Bookings</Text>
                {pastBookings.slice(0, 10).map((b) => (
                  <TouchableOpacity key={b.id} onPress={() => openEdit(b)} activeOpacity={0.7}>
                    <View style={styles.listRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listName}>{b.vehicle_name || 'No vehicle'}</Text>
                        <Text style={styles.listSub}>{b.renter_name} · {formatDate(b.pickup_date || '')}</Text>
                      </View>
                      <Badge label={b.status} variant={BADGE_MAP[b.status]} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editing ? 'Edit Booking' : 'New Booking'} size="lg">
        <Select
          label="Vehicle"
          placeholder="Select vehicle"
          options={vehicles.map((v) => ({ label: `${v.year} ${v.make} ${v.model}`, value: v.id }))}
          value={form.vehicle_id}
          onValueChange={(v) => setForm({ ...form, vehicle_id: v })}
        />
        <Input label="Renter Name" placeholder="Guest name" value={form.renter_name} onChangeText={(v) => setForm({ ...form, renter_name: v })} />
        <Select label="Status" options={STATUS_OPTIONS} value={form.status} onValueChange={(v) => setForm({ ...form, status: v as BookingStatus })} />
        <View style={styles.formRow}>
          <Input label="Pickup Date" placeholder="YYYY-MM-DD" value={form.pickup_date} onChangeText={(v) => setForm({ ...form, pickup_date: v })} containerStyle={styles.formHalf} />
          <Input label="Pickup Time" placeholder="10:00 AM" value={form.pickup_time} onChangeText={(v) => setForm({ ...form, pickup_time: v })} containerStyle={styles.formHalf} />
        </View>
        <Input label="Pickup Location" placeholder="Location" value={form.pickup_location} onChangeText={(v) => setForm({ ...form, pickup_location: v })} />
        <View style={styles.formRow}>
          <Input label="Return Date" placeholder="YYYY-MM-DD" value={form.return_date} onChangeText={(v) => setForm({ ...form, return_date: v })} containerStyle={styles.formHalf} />
          <Input label="Return Time" placeholder="10:00 AM" value={form.return_time} onChangeText={(v) => setForm({ ...form, return_time: v })} containerStyle={styles.formHalf} />
        </View>
        <Input label="Return Location" placeholder="Location" value={form.return_location} onChangeText={(v) => setForm({ ...form, return_location: v })} />
        <Input label="Daily Rate ($)" placeholder="65" keyboardType="numeric" value={form.daily_rate} onChangeText={(v) => setForm({ ...form, daily_rate: v })} />
        <Input label="Notes" placeholder="Notes" multiline value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} style={{ height: 60, textAlignVertical: 'top' }} />
        <View style={styles.formActions}>
          <Button title="Cancel" variant="outline" onPress={() => { setShowModal(false); resetForm(); }} />
          <Button title={editing ? 'Save' : 'Create Booking'} onPress={handleSave} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.heading3, marginBottom: spacing.md },
  cardGrid: { gap: spacing.md },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  bookingVehicle: { fontSize: 16, fontWeight: '600', color: colors.text },
  bookingRenter: { ...typography.bodySmall, marginBottom: spacing.md },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md },
  dateLabel: { ...typography.caption, marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  priceText: { fontSize: 16, fontWeight: '700', color: colors.primary, marginLeft: 'auto' },
  progressContainer: { marginBottom: spacing.md },
  progressBg: { height: 4, backgroundColor: colors.surface, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  progressText: { ...typography.caption, textAlign: 'right' },
  checkRow: { flexDirection: 'row', gap: spacing.xl },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkText: { ...typography.bodySmall },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  listName: { fontSize: 14, fontWeight: '500', color: colors.text },
  listSub: { ...typography.caption, marginTop: 2 },
  formRow: { flexDirection: 'row', gap: spacing.md },
  formHalf: { flex: 1 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },
  });
}
