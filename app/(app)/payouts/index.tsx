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
import { KpiCard } from '@/components/charts/kpi-card';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Payout, PayoutType } from '@/types/database';

const TYPE_OPTIONS: { label: string; value: PayoutType }[] = [
  { label: 'Owner Draw', value: 'owner_draw' },
  { label: 'Salary', value: 'salary' },
  { label: 'Bonus', value: 'bonus' },
  { label: 'Reimbursement', value: 'reimbursement' },
  { label: 'Other', value: 'other' },
];

const TYPE_BADGE: Record<PayoutType, 'purple' | 'info' | 'success' | 'warning' | 'default'> = {
  owner_draw: 'purple',
  salary: 'info',
  bonus: 'success',
  reimbursement: 'warning',
  other: 'default',
};

const TYPE_ICON: Record<PayoutType, React.ComponentProps<typeof Ionicons>['name']> = {
  owner_draw: 'wallet-outline',
  salary: 'cash-outline',
  bonus: 'star-outline',
  reimbursement: 'return-down-back-outline',
  other: 'ellipsis-horizontal-outline',
};

const TYPE_COLOR: Record<PayoutType, string> = {
  owner_draw: colors.primary,
  salary: colors.info,
  bonus: colors.success,
  reimbursement: colors.warning,
  other: colors.textMuted,
};

export default function PayoutsScreen() {
  const { data: payouts, loading, refresh, create, update, remove } =
    useSupabaseCrud<Payout>('payouts', { orderBy: 'date', ascending: false });
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Payout | null>(null);
  const [form, setForm] = useState({
    date: '',
    recipient: '',
    type: 'owner_draw' as PayoutType,
    amount: '',
    description: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      date: '',
      recipient: '',
      type: 'owner_draw',
      amount: '',
      description: '',
      notes: '',
    });
    setEditing(null);
  };

  const openEdit = (p: Payout) => {
    setEditing(p);
    setForm({
      date: p.date || '',
      recipient: p.recipient || '',
      type: p.type,
      amount: p.amount?.toString() || '',
      description: p.description || '',
      notes: p.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      date: form.date || new Date().toISOString().split('T')[0],
      recipient: form.recipient,
      type: form.type,
      amount: form.amount ? parseFloat(form.amount) : 0,
      description: form.description || null,
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
    const total = payouts.reduce((sum, p) => sum + p.amount, 0);
    const byType: Record<string, number> = {};
    payouts.forEach((p) => {
      const label = TYPE_OPTIONS.find((o) => o.value === p.type)?.label ?? p.type;
      byType[label] = (byType[label] || 0) + p.amount;
    });
    return { total, byType };
  }, [payouts]);

  const getTypeLabel = (type: PayoutType) =>
    TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;

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
          title="Payouts"
          subtitle={`${payouts.length} payout${payouts.length !== 1 ? 's' : ''}`}
          action={
            <Button
              title="New Payout"
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
            label="Total Payouts"
            value={formatCurrency(kpis.total)}
            icon="wallet-outline"
            iconColor={colors.primary}
            style={styles.kpiCard}
          />
          {Object.entries(kpis.byType).map(([label, amount]) => (
            <KpiCard
              key={label}
              label={label}
              value={formatCurrency(amount)}
              icon="cash-outline"
              iconColor={colors.info}
              style={styles.kpiCard}
            />
          ))}
        </ScrollView>

        {/* Payout List */}
        {payouts.length === 0 && !loading ? (
          <EmptyState
            icon="wallet-outline"
            title="No payouts"
            description="Record owner draws, salaries, and other disbursements"
            actionLabel="New Payout"
            onAction={() => {
              resetForm();
              setShowModal(true);
            }}
          />
        ) : (
          <View style={styles.listSection}>
            {payouts.map((p) => (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.7}
                onPress={() => openEdit(p)}
              >
                <View style={styles.payoutRow}>
                  <View
                    style={[
                      styles.typeIcon,
                      { backgroundColor: `${TYPE_COLOR[p.type]}18` },
                    ]}
                  >
                    <Ionicons
                      name={TYPE_ICON[p.type]}
                      size={18}
                      color={TYPE_COLOR[p.type]}
                    />
                  </View>
                  <View style={styles.payoutInfo}>
                    <Text style={styles.payoutRecipient} numberOfLines={1}>
                      {p.recipient}
                    </Text>
                    <Text style={styles.payoutMeta}>
                      {formatDate(p.date, 'MMM d, yyyy')}
                      {p.description ? ` · ${p.description}` : ''}
                    </Text>
                  </View>
                  <View style={styles.payoutRight}>
                    <Text style={styles.payoutAmount}>
                      {formatCurrency(p.amount)}
                    </Text>
                    <Badge
                      label={getTypeLabel(p.type)}
                      variant={TYPE_BADGE[p.type]}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => remove(p.id)}
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
        title={editing ? 'Edit Payout' : 'New Payout'}
        size="md"
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
        <Input
          label="Recipient"
          placeholder="Who is this paid to?"
          value={form.recipient}
          onChangeText={(v) => setForm({ ...form, recipient: v })}
        />
        <Select
          label="Type"
          placeholder="Select payout type"
          options={TYPE_OPTIONS}
          value={form.type}
          onValueChange={(v) => setForm({ ...form, type: v as PayoutType })}
        />
        <Input
          label="Description"
          placeholder="What is this payout for?"
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
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
            title={editing ? 'Save Changes' : 'Add Payout'}
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
  listSection: { gap: 1 },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutInfo: { flex: 1 },
  payoutRecipient: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  payoutMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  payoutRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  payoutAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  deleteBtn: {
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
