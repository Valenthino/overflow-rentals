import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  RefreshControl,
  Alert,
  Platform,
  ActivityIndicator,
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
import { formatCurrency, formatDate, parseDollar } from '@/lib/utils';
import type { Trip, TripStatus } from '@/types/database';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { label: string; value: TripStatus }[] = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_BADGE: Record<TripStatus, 'info' | 'success' | 'default' | 'danger'> = {
  upcoming: 'info',
  active: 'success',
  completed: 'default',
  cancelled: 'danger',
};

const EMPTY_FORM = {
  reservation_id: '',
  vehicle_name: '',
  guest_name: '',
  status: 'upcoming' as TripStatus,
  start_date: '',
  end_date: '',
  pickup_location: '',
  return_location: '',
  checkin_odometer: '',
  checkout_odometer: '',
  trip_price: '',
  total_discounts: '',
  extras: '',
  delivery_fee: '',
  other_fees: '',
  sales_tax: '',
  host_fee: '',
  total_earnings: '',
  days: '',
  source: '',
  notes: '',
};

type FormState = typeof EMPTY_FORM;

// ---------------------------------------------------------------------------
// CSV parsing helpers
// ---------------------------------------------------------------------------

/**
 * Parse a single CSV line respecting quoted fields.
 * Handles double-quote escaping ("") inside quoted strings.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Attempt to normalise a header name coming from a Turo CSV export into the
 * snake_case field name used in the database.
 */
function normaliseHeader(raw: string): string {
  const lower = raw
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const MAP: Record<string, string> = {
    reservation_id: 'reservation_id',
    reservation: 'reservation_id',
    vehicle: 'vehicle_name',
    vehicle_name: 'vehicle_name',
    guest: 'guest_name',
    guest_name: 'guest_name',
    status: 'status',
    trip_start: 'start_date',
    start_date: 'start_date',
    start: 'start_date',
    trip_end: 'end_date',
    end_date: 'end_date',
    end: 'end_date',
    pickup_location: 'pickup_location',
    pickup: 'pickup_location',
    return_location: 'return_location',
    return: 'return_location',
    checkin_odometer: 'checkin_odometer',
    checkout_odometer: 'checkout_odometer',
    trip_price: 'trip_price',
    price: 'trip_price',
    total_discounts: 'total_discounts',
    discounts: 'total_discounts',
    extras: 'extras',
    delivery_fee: 'delivery_fee',
    delivery: 'delivery_fee',
    other_fees: 'other_fees',
    sales_tax: 'sales_tax',
    tax: 'sales_tax',
    host_fee: 'host_fee',
    turo_fee: 'host_fee',
    total_earnings: 'total_earnings',
    earnings: 'total_earnings',
    your_earnings: 'total_earnings',
    host_earnings: 'total_earnings',
    days: 'days',
    trip_days: 'days',
    source: 'source',
    notes: 'notes',
  };

  return MAP[lower] || lower;
}

/**
 * Try to convert a date string from common Turo CSV formats (MM/DD/YYYY,
 * M/D/YYYY, YYYY-MM-DD) into ISO YYYY-MM-DD.
 */
function parseDate(raw: string): string | null {
  if (!raw) return null;
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  // MM/DD/YYYY or M/D/YYYY
  const parts = raw.split('/');
  if (parts.length === 3) {
    const [m, d, y] = parts;
    const month = m.padStart(2, '0');
    const day = d.padStart(2, '0');
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${month}-${day}`;
  }
  return raw; // Return raw as fallback
}

function parseStatus(raw: string): TripStatus {
  const lower = raw.toLowerCase().trim();
  if (lower === 'upcoming' || lower === 'booked' || lower === 'reserved') return 'upcoming';
  if (lower === 'active' || lower === 'in progress' || lower === 'in_progress') return 'active';
  if (lower === 'completed' || lower === 'done' || lower === 'finished' || lower === 'past') return 'completed';
  if (lower === 'cancelled' || lower === 'canceled') return 'cancelled';
  return 'completed'; // default for Turo historical data
}

/**
 * Parse pasted CSV text into an array of partial Trip objects.
 */
function parseCsv(text: string): Partial<Trip>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normaliseHeader);
  const results: Partial<Trip>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, unknown> = {};

    headers.forEach((header, idx) => {
      const val = idx < values.length ? values[idx] : '';
      if (!val) return;

      switch (header) {
        case 'trip_price':
        case 'total_discounts':
        case 'extras':
        case 'delivery_fee':
        case 'other_fees':
        case 'sales_tax':
        case 'host_fee':
        case 'total_earnings':
          row[header] = parseDollar(val);
          break;
        case 'days':
        case 'checkin_odometer':
        case 'checkout_odometer':
          row[header] = parseInt(val.replace(/[^0-9-]/g, '')) || 0;
          break;
        case 'start_date':
        case 'end_date':
          row[header] = parseDate(val);
          break;
        case 'status':
          row[header] = parseStatus(val);
          break;
        default:
          row[header] = val;
          break;
      }
    });

    // Ensure required numeric fields default to 0
    const numericFields = [
      'trip_price', 'total_discounts', 'extras', 'delivery_fee',
      'other_fees', 'sales_tax', 'host_fee', 'total_earnings', 'days',
    ] as const;
    numericFields.forEach((f) => {
      if (row[f] === undefined) row[f] = 0;
    });

    if (!row.status) row.status = 'completed';

    results.push(row as Partial<Trip>);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TripsScreen() {
  const {
    data: trips,
    loading,
    refresh,
    create,
    update,
    remove,
  } = useSupabaseCrud<Trip>('trips', { orderBy: 'start_date' });

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Trip form modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // CSV import modal state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvParsed, setCsvParsed] = useState<Partial<Trip>[]>([]);
  const [csvError, setCsvError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Summary stats
  // -----------------------------------------------------------------------

  const stats = useMemo(() => {
    const total = trips.length;
    const totalEarnings = trips.reduce((sum, t) => sum + (t.total_earnings || 0), 0);
    const avgEarnings = total > 0 ? totalEarnings / total : 0;
    return { total, totalEarnings, avgEarnings };
  }, [trips]);

  // -----------------------------------------------------------------------
  // Form helpers
  // -----------------------------------------------------------------------

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingTrip(null);
  };

  const openEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setForm({
      reservation_id: trip.reservation_id || '',
      vehicle_name: trip.vehicle_name || '',
      guest_name: trip.guest_name || '',
      status: trip.status,
      start_date: trip.start_date || '',
      end_date: trip.end_date || '',
      pickup_location: trip.pickup_location || '',
      return_location: trip.return_location || '',
      checkin_odometer: trip.checkin_odometer?.toString() || '',
      checkout_odometer: trip.checkout_odometer?.toString() || '',
      trip_price: trip.trip_price?.toString() || '',
      total_discounts: trip.total_discounts?.toString() || '',
      extras: trip.extras?.toString() || '',
      delivery_fee: trip.delivery_fee?.toString() || '',
      other_fees: trip.other_fees?.toString() || '',
      sales_tax: trip.sales_tax?.toString() || '',
      host_fee: trip.host_fee?.toString() || '',
      total_earnings: trip.total_earnings?.toString() || '',
      days: trip.days?.toString() || '',
      source: trip.source || '',
      notes: trip.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload: Partial<Trip> = {
      reservation_id: form.reservation_id || null,
      vehicle_name: form.vehicle_name || null,
      guest_name: form.guest_name || null,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      pickup_location: form.pickup_location || null,
      return_location: form.return_location || null,
      checkin_odometer: form.checkin_odometer ? parseInt(form.checkin_odometer) : null,
      checkout_odometer: form.checkout_odometer ? parseInt(form.checkout_odometer) : null,
      trip_price: form.trip_price ? parseFloat(form.trip_price) : 0,
      total_discounts: form.total_discounts ? parseFloat(form.total_discounts) : 0,
      extras: form.extras ? parseFloat(form.extras) : 0,
      delivery_fee: form.delivery_fee ? parseFloat(form.delivery_fee) : 0,
      other_fees: form.other_fees ? parseFloat(form.other_fees) : 0,
      sales_tax: form.sales_tax ? parseFloat(form.sales_tax) : 0,
      host_fee: form.host_fee ? parseFloat(form.host_fee) : 0,
      total_earnings: form.total_earnings ? parseFloat(form.total_earnings) : 0,
      days: form.days ? parseInt(form.days) : 0,
      source: form.source || null,
      notes: form.notes || null,
    };

    if (editingTrip) {
      await update(editingTrip.id, payload);
    } else {
      await create(payload);
    }
    setSaving(false);
    setShowModal(false);
    resetForm();
  };

  // -----------------------------------------------------------------------
  // Delete
  // -----------------------------------------------------------------------

  const confirmDelete = (id: string) => {
    if (Platform.OS === 'web') {
      setDeletingId(id);
    } else {
      Alert.alert('Delete Trip', 'Are you sure you want to delete this trip?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => remove(id),
        },
      ]);
    }
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setDeletingId(null);
  };

  // -----------------------------------------------------------------------
  // CSV import
  // -----------------------------------------------------------------------

  const handleParseCsv = () => {
    setCsvError('');
    setImportResult('');
    try {
      const parsed = parseCsv(csvText);
      if (parsed.length === 0) {
        setCsvError('No valid rows found. Make sure your CSV has a header row and at least one data row.');
        return;
      }
      setCsvParsed(parsed);
    } catch (e: any) {
      setCsvError(e.message || 'Failed to parse CSV data.');
    }
  };

  const handleImportCsv = async () => {
    if (csvParsed.length === 0) return;
    setImporting(true);
    setImportResult('');
    let successCount = 0;
    let failCount = 0;

    for (const row of csvParsed) {
      const { error } = await create(row);
      if (error) {
        failCount++;
      } else {
        successCount++;
      }
    }

    setImporting(false);
    setImportResult(
      `Imported ${successCount} trip${successCount !== 1 ? 's' : ''} successfully${failCount > 0 ? `, ${failCount} failed` : ''}.`
    );
    setCsvParsed([]);
  };

  const resetCsvModal = () => {
    setCsvText('');
    setCsvParsed([]);
    setCsvError('');
    setImportResult('');
    setShowCsvModal(false);
  };

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const renderTripDates = (trip: Trip) => {
    if (trip.start_date && trip.end_date) {
      return `${formatDate(trip.start_date, 'MMM d')} - ${formatDate(trip.end_date, 'MMM d, yyyy')}`;
    }
    if (trip.start_date) return formatDate(trip.start_date);
    if (trip.end_date) return formatDate(trip.end_date);
    return 'No dates';
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <ScreenHeader
          title="Trips"
          subtitle={`${trips.length} trip${trips.length !== 1 ? 's' : ''}`}
          action={
            <View style={styles.headerActions}>
              <Button
                title="Import CSV"
                variant="outline"
                onPress={() => setShowCsvModal(true)}
                size="sm"
                icon={<Ionicons name="cloud-upload-outline" size={14} color={colors.text} />}
              />
              <Button
                title="Add Trip"
                onPress={() => {
                  resetForm();
                  setShowModal(true);
                }}
                size="sm"
                icon={<Ionicons name="add" size={16} color={colors.white} />}
              />
            </View>
          }
        />

        {/* KPI summary row */}
        <View style={[styles.kpiRow, isDesktop && styles.kpiRowDesktop]}>
          <KpiCard
            label="Total Trips"
            value={stats.total.toString()}
            icon="car-outline"
            iconColor={colors.primary}
            style={styles.kpiCard}
          />
          <KpiCard
            label="Total Earnings"
            value={formatCurrency(stats.totalEarnings)}
            icon="cash-outline"
            iconColor={colors.success}
            style={styles.kpiCard}
          />
          <KpiCard
            label="Avg / Trip"
            value={formatCurrency(stats.avgEarnings)}
            icon="trending-up-outline"
            iconColor={colors.info}
            style={styles.kpiCard}
          />
        </View>

        {/* Trip list */}
        {trips.length === 0 && !loading ? (
          <EmptyState
            icon="airplane-outline"
            title="No trips yet"
            description="Add your first trip or import from a Turo CSV export"
            actionLabel="Add Trip"
            onAction={() => {
              resetForm();
              setShowModal(true);
            }}
          />
        ) : (
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {trips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                activeOpacity={0.7}
                onPress={() => openEdit(trip)}
              >
                <Card style={styles.tripCard}>
                  <CardContent style={styles.tripContent}>
                    {/* Top row: guest + status */}
                    <View style={styles.tripHeader}>
                      <View style={styles.tripIcon}>
                        <Ionicons name="person-outline" size={20} color={colors.primary} />
                      </View>
                      <Badge label={trip.status} variant={STATUS_BADGE[trip.status]} />
                    </View>

                    {/* Guest & vehicle */}
                    <Text style={styles.tripGuestName} numberOfLines={1}>
                      {trip.guest_name || 'Unknown Guest'}
                    </Text>
                    {trip.vehicle_name ? (
                      <Text style={styles.tripVehicleName} numberOfLines={1}>
                        {trip.vehicle_name}
                      </Text>
                    ) : null}

                    {/* Dates */}
                    <View style={styles.tripDatesRow}>
                      <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.tripDatesText}>{renderTripDates(trip)}</Text>
                      {trip.days > 0 && (
                        <Text style={styles.tripDaysText}>
                          {trip.days} day{trip.days !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>

                    {/* Financials */}
                    <View style={styles.tripStats}>
                      <View style={styles.stat}>
                        <Text style={styles.statLabel}>Trip Price</Text>
                        <Text style={styles.statValue}>{formatCurrency(trip.trip_price)}</Text>
                      </View>
                      <View style={styles.stat}>
                        <Text style={styles.statLabel}>Earnings</Text>
                        <Text style={[styles.statValue, { color: colors.success }]}>
                          {formatCurrency(trip.total_earnings)}
                        </Text>
                      </View>
                    </View>

                    {/* Delete button */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        confirmDelete(trip.id);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

      {/* ----------------------------------------------------------------- */}
      {/* Web delete confirmation inline (replaces Alert on web)            */}
      {/* ----------------------------------------------------------------- */}
      {deletingId !== null && (
        <Modal
          visible
          onClose={() => setDeletingId(null)}
          title="Delete Trip"
          size="sm"
        >
          <Text style={styles.deleteConfirmText}>
            Are you sure you want to delete this trip? This action cannot be undone.
          </Text>
          <View style={styles.formActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setDeletingId(null)}
            />
            <Button
              title="Delete"
              variant="destructive"
              onPress={() => handleDelete(deletingId)}
            />
          </View>
        </Modal>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Add / Edit Trip Modal                                             */}
      {/* ----------------------------------------------------------------- */}
      <Modal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingTrip ? 'Edit Trip' : 'Add Trip'}
        size="lg"
      >
        {/* Guest & Vehicle */}
        <View style={styles.formRow}>
          <Input
            label="Guest Name"
            placeholder="John Doe"
            value={form.guest_name}
            onChangeText={(v) => setForm({ ...form, guest_name: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Vehicle"
            placeholder="2024 Toyota Camry"
            value={form.vehicle_name}
            onChangeText={(v) => setForm({ ...form, vehicle_name: v })}
            containerStyle={styles.formHalf}
          />
        </View>

        {/* Reservation & Status */}
        <View style={styles.formRow}>
          <Input
            label="Reservation ID"
            placeholder="RES-12345"
            value={form.reservation_id}
            onChangeText={(v) => setForm({ ...form, reservation_id: v })}
            containerStyle={styles.formHalf}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v as TripStatus })}
            containerStyle={styles.formHalf}
          />
        </View>

        {/* Dates */}
        <View style={styles.formRow}>
          <Input
            label="Start Date"
            placeholder="YYYY-MM-DD"
            value={form.start_date}
            onChangeText={(v) => setForm({ ...form, start_date: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="End Date"
            placeholder="YYYY-MM-DD"
            value={form.end_date}
            onChangeText={(v) => setForm({ ...form, end_date: v })}
            containerStyle={styles.formHalf}
          />
        </View>

        {/* Days */}
        <Input
          label="Days"
          placeholder="3"
          keyboardType="numeric"
          value={form.days}
          onChangeText={(v) => setForm({ ...form, days: v })}
        />

        {/* Locations */}
        <View style={styles.formRow}>
          <Input
            label="Pickup Location"
            placeholder="Airport, Home, etc."
            value={form.pickup_location}
            onChangeText={(v) => setForm({ ...form, pickup_location: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Return Location"
            placeholder="Airport, Home, etc."
            value={form.return_location}
            onChangeText={(v) => setForm({ ...form, return_location: v })}
            containerStyle={styles.formHalf}
          />
        </View>

        {/* Odometer */}
        <View style={styles.formRow}>
          <Input
            label="Check-in Odometer"
            placeholder="45000"
            keyboardType="numeric"
            value={form.checkin_odometer}
            onChangeText={(v) => setForm({ ...form, checkin_odometer: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Checkout Odometer"
            placeholder="45500"
            keyboardType="numeric"
            value={form.checkout_odometer}
            onChangeText={(v) => setForm({ ...form, checkout_odometer: v })}
            containerStyle={styles.formHalf}
          />
        </View>

        {/* Section label: Financials */}
        <Text style={styles.formSectionLabel}>Financials</Text>

        {/* Trip Price & Total Earnings */}
        <View style={styles.formRow}>
          <Input
            label="Trip Price ($)"
            placeholder="250"
            keyboardType="numeric"
            value={form.trip_price}
            onChangeText={(v) => setForm({ ...form, trip_price: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Total Earnings ($)"
            placeholder="200"
            keyboardType="numeric"
            value={form.total_earnings}
            onChangeText={(v) => setForm({ ...form, total_earnings: v })}
            containerStyle={styles.formHalf}
          />
        </View>

        {/* Discounts & Extras */}
        <View style={styles.formRow}>
          <Input
            label="Discounts ($)"
            placeholder="0"
            keyboardType="numeric"
            value={form.total_discounts}
            onChangeText={(v) => setForm({ ...form, total_discounts: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Extras ($)"
            placeholder="0"
            keyboardType="numeric"
            value={form.extras}
            onChangeText={(v) => setForm({ ...form, extras: v })}
            containerStyle={styles.formHalf}
          />
        </View>

        {/* Delivery & Other Fees */}
        <View style={styles.formRow}>
          <Input
            label="Delivery Fee ($)"
            placeholder="0"
            keyboardType="numeric"
            value={form.delivery_fee}
            onChangeText={(v) => setForm({ ...form, delivery_fee: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Other Fees ($)"
            placeholder="0"
            keyboardType="numeric"
            value={form.other_fees}
            onChangeText={(v) => setForm({ ...form, other_fees: v })}
            containerStyle={styles.formHalf}
          />
        </View>

        {/* Sales Tax & Host Fee */}
        <View style={styles.formRow}>
          <Input
            label="Sales Tax ($)"
            placeholder="0"
            keyboardType="numeric"
            value={form.sales_tax}
            onChangeText={(v) => setForm({ ...form, sales_tax: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Host Fee ($)"
            placeholder="0"
            keyboardType="numeric"
            value={form.host_fee}
            onChangeText={(v) => setForm({ ...form, host_fee: v })}
            containerStyle={styles.formHalf}
          />
        </View>

        {/* Source */}
        <Input
          label="Source"
          placeholder="Turo, Direct, etc."
          value={form.source}
          onChangeText={(v) => setForm({ ...form, source: v })}
        />

        {/* Notes */}
        <Input
          label="Notes"
          placeholder="Any notes about this trip"
          multiline
          numberOfLines={3}
          value={form.notes}
          onChangeText={(v) => setForm({ ...form, notes: v })}
          style={{ height: 80, textAlignVertical: 'top' }}
        />

        {/* Actions */}
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
            title={editingTrip ? 'Save Changes' : 'Add Trip'}
            onPress={handleSave}
            loading={saving}
          />
        </View>
      </Modal>

      {/* ----------------------------------------------------------------- */}
      {/* CSV Import Modal                                                  */}
      {/* ----------------------------------------------------------------- */}
      <Modal
        visible={showCsvModal}
        onClose={resetCsvModal}
        title="Import Trips from CSV"
        size="lg"
      >
        <Text style={styles.csvDescription}>
          Paste your Turo CSV export data below. The first row should be the
          header row. Supported columns include: Reservation ID, Vehicle, Guest,
          Status, Trip Start, Trip End, Days, Trip Price, Discounts, Extras,
          Delivery Fee, Other Fees, Sales Tax, Host Fee, Total Earnings, and more.
        </Text>

        {/* CSV paste area */}
        <View style={styles.csvInputWrapper}>
          <TextInput
            style={styles.csvInput}
            placeholder="Paste CSV data here..."
            placeholderTextColor={colors.textMuted}
            value={csvText}
            onChangeText={(v) => {
              setCsvText(v);
              setCsvParsed([]);
              setCsvError('');
              setImportResult('');
            }}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Parse button */}
        <Button
          title="Parse CSV"
          variant="secondary"
          onPress={handleParseCsv}
          disabled={!csvText.trim()}
          icon={<Ionicons name="code-slash-outline" size={14} color={colors.text} />}
        />

        {/* Error display */}
        {csvError ? (
          <View style={styles.csvErrorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.csvErrorText}>{csvError}</Text>
          </View>
        ) : null}

        {/* Parsed preview */}
        {csvParsed.length > 0 && (
          <View style={styles.csvPreview}>
            <View style={styles.csvPreviewHeader}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.csvPreviewTitle}>
                {csvParsed.length} trip{csvParsed.length !== 1 ? 's' : ''} found
              </Text>
            </View>

            <ScrollView
              style={styles.csvPreviewList}
              nestedScrollEnabled
            >
              {csvParsed.slice(0, 10).map((row, idx) => (
                <View key={idx} style={styles.csvPreviewRow}>
                  <Text style={styles.csvPreviewRowNum}>{idx + 1}.</Text>
                  <View style={styles.csvPreviewRowContent}>
                    <Text style={styles.csvPreviewRowTitle} numberOfLines={1}>
                      {(row.guest_name as string) || 'Unknown Guest'}
                      {row.vehicle_name ? ` - ${row.vehicle_name}` : ''}
                    </Text>
                    <Text style={styles.csvPreviewRowSub}>
                      {row.start_date ? formatDate(row.start_date as string, 'MMM d') : ''}
                      {row.start_date && row.end_date ? ' - ' : ''}
                      {row.end_date ? formatDate(row.end_date as string, 'MMM d, yyyy') : ''}
                      {row.total_earnings
                        ? `  |  ${formatCurrency(row.total_earnings as number)}`
                        : ''}
                    </Text>
                  </View>
                </View>
              ))}
              {csvParsed.length > 10 && (
                <Text style={styles.csvPreviewMore}>
                  + {csvParsed.length - 10} more trip{csvParsed.length - 10 !== 1 ? 's' : ''}
                </Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* Import result */}
        {importResult ? (
          <View style={styles.csvSuccessBox}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.csvSuccessText}>{importResult}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.formActions}>
          <Button title="Cancel" variant="outline" onPress={resetCsvModal} />
          {csvParsed.length > 0 && !importResult && (
            <Button
              title={`Import ${csvParsed.length} Trip${csvParsed.length !== 1 ? 's' : ''}`}
              onPress={handleImportCsv}
              loading={importing}
              icon={<Ionicons name="cloud-upload-outline" size={14} color={colors.white} />}
            />
          )}
          {importResult && (
            <Button title="Done" onPress={resetCsvModal} />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['5xl'],
  },

  // Header actions
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  // KPI row
  kpiRow: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  kpiRowDesktop: {
    flexDirection: 'row',
  },
  kpiCard: {
    flex: 1,
  },

  // Trip grid
  grid: {
    gap: spacing.md,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Trip card
  tripCard: {
    minWidth: 280,
  },
  tripContent: {
    paddingTop: spacing.lg,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tripIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripGuestName: {
    ...typography.heading3,
    marginBottom: 2,
  },
  tripVehicleName: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  tripDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  tripDatesText: {
    ...typography.caption,
    flex: 1,
  },
  tripDaysText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  tripStats: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  stat: {},
  statLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  deleteBtn: {
    position: 'absolute',
    top: spacing.lg,
    right: 0,
    padding: spacing.xs,
  },

  // Delete confirmation
  deleteConfirmText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Form
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formHalf: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  formSectionLabel: {
    ...typography.label,
    color: colors.primary,
    marginTop: spacing.sm,
    marginBottom: -spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
    fontWeight: '600',
  },

  // CSV modal
  csvDescription: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  csvInputWrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 160,
    maxHeight: 240,
  },
  csvInput: {
    flex: 1,
    padding: spacing.md,
    color: colors.text,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 160,
    textAlignVertical: 'top',
  },
  csvErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerMuted,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  csvErrorText: {
    ...typography.bodySmall,
    color: colors.danger,
    flex: 1,
  },
  csvSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successMuted,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  csvSuccessText: {
    ...typography.bodySmall,
    color: colors.success,
    flex: 1,
  },
  csvPreview: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  csvPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  csvPreviewTitle: {
    ...typography.label,
    color: colors.success,
  },
  csvPreviewList: {
    maxHeight: 200,
  },
  csvPreviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  csvPreviewRowNum: {
    ...typography.caption,
    width: 24,
    marginTop: 2,
  },
  csvPreviewRowContent: {
    flex: 1,
  },
  csvPreviewRowTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  csvPreviewRowSub: {
    ...typography.caption,
    marginTop: 2,
  },
  csvPreviewMore: {
    ...typography.caption,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    color: colors.textMuted,
  },
});
