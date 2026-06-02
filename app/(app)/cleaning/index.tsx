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
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Cleaning, CleaningType, CleaningStatus, Vehicle } from '@/types/database';

const TYPE_OPTIONS = [
  { label: 'Quick', value: 'quick' },
  { label: 'Full', value: 'full' },
  { label: 'Deep', value: 'deep' },
];

const STATUS_OPTIONS = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
];

const STATUS_BADGE: Record<CleaningStatus, 'info' | 'purple' | 'success'> = {
  scheduled: 'info',
  in_progress: 'purple',
  completed: 'success',
};

const TYPE_BADGE: Record<CleaningType, 'default' | 'warning' | 'danger'> = {
  quick: 'default',
  full: 'warning',
  deep: 'danger',
};

export default function CleaningScreen() {
  const { data: cleanings, loading, refresh, create, update, remove } =
    useSupabaseCrud<Cleaning>('cleaning', { orderBy: 'date' });
  const { data: vehicles } = useSupabaseCrud<Vehicle>('vehicles');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { tokens: colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Cleaning | null>(null);
  const [form, setForm] = useState({
    vehicle_id: '',
    vehicle_name: '',
    date: '',
    assigned_to: '',
    type: 'full' as CleaningType,
    status: 'scheduled' as CleaningStatus,
    cost: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      vehicle_id: '',
      vehicle_name: '',
      date: '',
      assigned_to: '',
      type: 'full',
      status: 'scheduled',
      cost: '',
      notes: '',
    });
    setEditing(null);
  };

  const openEdit = (c: Cleaning) => {
    setEditing(c);
    setForm({
      vehicle_id: c.vehicle_id || '',
      vehicle_name: c.vehicle_name || '',
      date: c.date || '',
      assigned_to: c.assigned_to || '',
      type: c.type,
      status: c.status,
      cost: c.cost?.toString() || '',
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
      date: form.date || new Date().toISOString().split('T')[0],
      assigned_to: form.assigned_to || null,
      type: form.type,
      status: form.status,
      cost: form.cost ? parseFloat(form.cost) : 0,
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

  const scheduledCount = cleanings.filter((c) => c.status !== 'completed').length;

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
          title="Cleaning"
          subtitle={`${cleanings.length} record${cleanings.length !== 1 ? 's' : ''}${scheduledCount > 0 ? ` · ${scheduledCount} pending` : ''}`}
          action={
            <Button
              title="Add Cleaning"
              onPress={() => {
                resetForm();
                setShowModal(true);
              }}
              size="sm"
              icon={<Ionicons name="add" size={16} color={colors.white} />}
            />
          }
        />

        {cleanings.length === 0 && !loading ? (
          <EmptyState
            icon="sparkles-outline"
            title="No cleaning records"
            description="Schedule your first cleaning to keep vehicles spotless"
            actionLabel="Add Cleaning"
            onAction={() => {
              resetForm();
              setShowModal(true);
            }}
          />
        ) : (
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {cleanings.map((c) => (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.7}
                onPress={() => openEdit(c)}
              >
                <Card style={styles.cleaningCard}>
                  <CardContent style={styles.cleaningContent}>
                    <View style={styles.cleaningHeader}>
                      <View style={styles.cleaningIcon}>
                        <Ionicons
                          name="sparkles"
                          size={24}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.headerBadges}>
                        <Badge label={c.type} variant={TYPE_BADGE[c.type]} />
                        <Badge
                          label={c.status.replace('_', ' ')}
                          variant={STATUS_BADGE[c.status]}
                        />
                      </View>
                    </View>
                    <Text style={styles.vehicleName}>
                      {c.vehicle_name || 'No vehicle'}
                    </Text>
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={13}
                          color={colors.textMuted}
                        />
                        <Text style={styles.detailText}>
                          {formatDate(c.date)}
                        </Text>
                      </View>
                      {c.assigned_to && (
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="person-outline"
                            size={13}
                            color={colors.textMuted}
                          />
                          <Text style={styles.detailText}>{c.assigned_to}</Text>
                        </View>
                      )}
                    </View>
                    {c.cost > 0 && (
                      <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Cost</Text>
                        <Text style={styles.costValue}>
                          {formatCurrency(c.cost)}
                        </Text>
                      </View>
                    )}
                    {c.notes && (
                      <Text style={styles.notesText} numberOfLines={2}>
                        {c.notes}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={async () => { if (await confirmDelete(c.vehicle_name || 'this cleaning')) remove(c.id); }}
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
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editing ? 'Edit Cleaning' : 'Add Cleaning'}
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
        <Input
          label="Date"
          placeholder="YYYY-MM-DD"
          value={form.date}
          onChangeText={(v) => setForm({ ...form, date: v })}
        />
        <Input
          label="Assigned To"
          placeholder="Cleaner name"
          value={form.assigned_to}
          onChangeText={(v) => setForm({ ...form, assigned_to: v })}
        />
        <View style={styles.formRow}>
          <Select
            label="Type"
            options={TYPE_OPTIONS}
            value={form.type}
            onValueChange={(v) =>
              setForm({ ...form, type: v as CleaningType })
            }
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onValueChange={(v) =>
              setForm({ ...form, status: v as CleaningStatus })
            }
          />
        </View>
        <Input
          label="Cost ($)"
          placeholder="50"
          keyboardType="numeric"
          value={form.cost}
          onChangeText={(v) => setForm({ ...form, cost: v })}
        />
        <Input
          label="Notes"
          placeholder="Cleaning notes"
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
            title={editing ? 'Save Changes' : 'Add Cleaning'}
            onPress={handleSave}
          />
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
  cleaningCard: { minWidth: 280 },
  cleaningContent: { paddingTop: spacing.lg },
  cleaningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cleaningIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
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
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  costLabel: { ...typography.caption },
  costValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  notesText: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
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
