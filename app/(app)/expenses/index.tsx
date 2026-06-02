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
import { spacing, radius } from '@/lib/theme';
import type { ColorTokens } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { confirmDelete } from '@/lib/confirm';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Expense, ExpenseCategory, Vehicle } from '@/types/database';

const CATEGORY_OPTIONS: { label: string; value: ExpenseCategory }[] = [
  { label: 'Fuel', value: 'fuel' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Cleaning', value: 'cleaning' },
  { label: 'Tolls & Tickets', value: 'tolls_tickets' },
  { label: 'Parking', value: 'parking' },
  { label: 'Registration', value: 'registration' },
  { label: 'Financing', value: 'financing' },
  { label: 'Supplies', value: 'supplies' },
  { label: 'Software', value: 'software' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Office', value: 'office' },
  { label: 'Professional', value: 'professional' },
  { label: 'Depreciation', value: 'depreciation' },
  { label: 'Other', value: 'other' },
];

const PAYMENT_OPTIONS = [
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Debit Card', value: 'debit_card' },
  { label: 'Cash', value: 'cash' },
  { label: 'E-Transfer', value: 'e_transfer' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Other', value: 'other' },
];

const CATEGORY_ICON: Record<ExpenseCategory, React.ComponentProps<typeof Ionicons>['name']> = {
  fuel: 'flame-outline',
  insurance: 'shield-outline',
  maintenance: 'build-outline',
  cleaning: 'sparkles-outline',
  tolls_tickets: 'receipt-outline',
  parking: 'car-outline',
  registration: 'document-text-outline',
  financing: 'cash-outline',
  supplies: 'cube-outline',
  software: 'laptop-outline',
  marketing: 'megaphone-outline',
  office: 'business-outline',
  professional: 'briefcase-outline',
  depreciation: 'trending-down-outline',
  other: 'ellipsis-horizontal-outline',
};

function categoryColors(colors: ColorTokens): Record<ExpenseCategory, string> {
  return {
    fuel: colors.chartOrange,
    insurance: colors.chartBlue,
    maintenance: colors.chartRed,
    cleaning: colors.chartCyan,
    tolls_tickets: colors.warning,
    parking: colors.chartPink,
    registration: colors.chartGreen,
    financing: colors.chartPurple,
    supplies: '#8B5CF6',
    software: colors.info,
    marketing: colors.chartPink,
    office: colors.textMuted,
    professional: colors.primary,
    depreciation: colors.danger,
    other: colors.textSecondary,
  };
}

export default function ExpensesScreen() {
  const { data: expenses, loading, refresh, create, update, remove } =
    useSupabaseCrud<Expense>('expenses', { orderBy: 'date', ascending: false });
  const { data: vehicles } = useSupabaseCrud<Vehicle>('vehicles');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { tokens: colors, typography } = useTheme();
  const CATEGORY_COLOR = useMemo(() => categoryColors(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    date: '',
    category: 'fuel' as ExpenseCategory,
    description: '',
    amount: '',
    vehicle_id: '',
    vehicle_name: '',
    vendor: '',
    payment_method: '',
    is_tax_deductible: true,
    gst_amount: '',
    receipt_url: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      date: '',
      category: 'fuel',
      description: '',
      amount: '',
      vehicle_id: '',
      vehicle_name: '',
      vendor: '',
      payment_method: '',
      is_tax_deductible: true,
      gst_amount: '',
      receipt_url: '',
      notes: '',
    });
    setEditing(null);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({
      date: e.date || '',
      category: e.category,
      description: e.description || '',
      amount: e.amount?.toString() || '',
      vehicle_id: e.vehicle_id || '',
      vehicle_name: e.vehicle_name || '',
      vendor: e.vendor || '',
      payment_method: e.payment_method || '',
      is_tax_deductible: e.is_tax_deductible,
      gst_amount: e.gst_amount?.toString() || '',
      receipt_url: e.receipt_url || '',
      notes: e.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const vehicle = vehicles.find((v) => v.id === form.vehicle_id);
    const payload = {
      date: form.date || new Date().toISOString().split('T')[0],
      category: form.category,
      description: form.description,
      amount: form.amount ? parseFloat(form.amount) : 0,
      vehicle_id: form.vehicle_id || null,
      vehicle_name: vehicle
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : form.vehicle_name || null,
      vendor: form.vendor || null,
      payment_method: form.payment_method || null,
      is_tax_deductible: form.is_tax_deductible,
      gst_amount: form.gst_amount ? parseFloat(form.gst_amount) : 0,
      receipt_url: form.receipt_url || null,
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
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const deductible = expenses
      .filter((e) => e.is_tax_deductible)
      .reduce((sum, e) => sum + e.amount, 0);
    const gstTotal = expenses.reduce((sum, e) => sum + (e.gst_amount || 0), 0);
    return { total, deductible, gstTotal };
  }, [expenses]);

  const getCategoryLabel = (cat: ExpenseCategory) =>
    CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? cat;

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
          title="Expenses"
          subtitle={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`}
          action={
            <Button
              title="Add Expense"
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
            label="Total Expenses"
            value={formatCurrency(kpis.total)}
            icon="wallet-outline"
            iconColor={colors.danger}
            style={styles.kpiCard}
          />
          <KpiCard
            label="Tax Deductible"
            value={formatCurrency(kpis.deductible)}
            icon="receipt-outline"
            iconColor={colors.success}
            style={styles.kpiCard}
          />
          <KpiCard
            label="GST Total"
            value={formatCurrency(kpis.gstTotal)}
            icon="pricetag-outline"
            iconColor={colors.info}
            style={styles.kpiCard}
          />
        </ScrollView>

        {/* Expense List */}
        {expenses.length === 0 && !loading ? (
          <EmptyState
            icon="wallet-outline"
            title="No expenses"
            description="Track your business expenses to understand costs and maximize deductions"
            actionLabel="Add Expense"
            onAction={() => {
              resetForm();
              setShowModal(true);
            }}
          />
        ) : (
          <View style={styles.listSection}>
            {expenses.map((e) => (
              <TouchableOpacity
                key={e.id}
                activeOpacity={0.7}
                onPress={() => openEdit(e)}
              >
                <View style={styles.expenseRow}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: `${CATEGORY_COLOR[e.category]}18` },
                    ]}
                  >
                    <Ionicons
                      name={CATEGORY_ICON[e.category]}
                      size={18}
                      color={CATEGORY_COLOR[e.category]}
                    />
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDescription} numberOfLines={1}>
                      {e.description || getCategoryLabel(e.category)}
                    </Text>
                    <Text style={styles.expenseMeta}>
                      {formatDate(e.date, 'MMM d, yyyy')}
                      {e.vehicle_name ? ` · ${e.vehicle_name}` : ''}
                      {e.vendor ? ` · ${e.vendor}` : ''}
                    </Text>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>
                      {formatCurrency(e.amount)}
                    </Text>
                    <View style={styles.expenseBadges}>
                      <Badge
                        label={getCategoryLabel(e.category)}
                        variant="default"
                      />
                      {e.is_tax_deductible && (
                        <Badge label="Deductible" variant="success" />
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={async () => { if (await confirmDelete(e.description || getCategoryLabel(e.category))) remove(e.id); }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={14}
                      color={colors.danger}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editing ? 'Edit Expense' : 'New Expense'}
        size="lg"
      >
        <View style={styles.formRow}>
          <Input
            label="Date"
            placeholder="YYYY-MM-DD"
            value={form.date}
            onChangeText={(v) => setForm({ ...form, date: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Amount ($)"
            placeholder="0.00"
            keyboardType="numeric"
            value={form.amount}
            onChangeText={(v) => setForm({ ...form, amount: v })}
            containerStyle={styles.formHalf}
          />
        </View>
        <Select
          label="Category"
          placeholder="Select category"
          options={CATEGORY_OPTIONS}
          value={form.category}
          onValueChange={(v) =>
            setForm({ ...form, category: v as ExpenseCategory })
          }
        />
        <Input
          label="Description"
          placeholder="What was this expense for?"
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
        />
        <Select
          label="Vehicle"
          placeholder="Select vehicle (optional)"
          options={[
            { label: 'None (General)', value: '' },
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
            label="Vendor"
            placeholder="Store or vendor name"
            value={form.vendor}
            onChangeText={(v) => setForm({ ...form, vendor: v })}
            containerStyle={styles.formHalf}
          />
          <Select
            label="Payment Method"
            placeholder="Select method"
            options={PAYMENT_OPTIONS}
            value={form.payment_method}
            onValueChange={(v) => setForm({ ...form, payment_method: v })}
            containerStyle={styles.formHalf}
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Tax Deductible</Text>
            <Text style={styles.toggleHelper}>
              Mark if this expense is deductible
            </Text>
          </View>
          <Switch
            value={form.is_tax_deductible}
            onValueChange={(v) => setForm({ ...form, is_tax_deductible: v })}
            trackColor={{ false: colors.surface, true: colors.primaryMuted }}
            thumbColor={
              form.is_tax_deductible ? colors.primary : colors.textMuted
            }
          />
        </View>
        <Input
          label="GST Amount ($)"
          placeholder="0.00"
          keyboardType="numeric"
          value={form.gst_amount}
          onChangeText={(v) => setForm({ ...form, gst_amount: v })}
        />
        <Input
          label="Receipt URL"
          placeholder="https://..."
          value={form.receipt_url}
          onChangeText={(v) => setForm({ ...form, receipt_url: v })}
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
            title={editing ? 'Save Changes' : 'Add Expense'}
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
  kpiRow: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  kpiCard: { minWidth: 160 },
  listSection: { gap: 1 },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: { flex: 1 },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  expenseMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  expenseBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  deleteBtn: {
    padding: spacing.xs,
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
}
