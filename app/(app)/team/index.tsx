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
import { spacing, radius } from '@/lib/theme';
import type { ColorTokens } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { TeamMember, TeamRole, PayType } from '@/types/database';

const ROLE_OPTIONS = [
  { label: 'Driver', value: 'driver' },
  { label: 'Cleaner', value: 'cleaner' },
  { label: 'Manager', value: 'manager' },
  { label: 'Admin', value: 'admin' },
];

const PAY_TYPE_OPTIONS = [
  { label: 'Hourly', value: 'hourly' },
  { label: 'Per Job', value: 'per_job' },
  { label: 'Salary', value: 'salary' },
];

const ROLE_BADGE: Record<TeamRole, 'purple' | 'info' | 'warning' | 'success'> = {
  driver: 'info',
  cleaner: 'success',
  manager: 'warning',
  admin: 'purple',
};

const ROLE_ICON: Record<TeamRole, string> = {
  driver: 'car-outline',
  cleaner: 'sparkles-outline',
  manager: 'briefcase-outline',
  admin: 'shield-checkmark-outline',
};

type FilterTab = 'all' | 'driver' | 'cleaner' | 'manager';

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Drivers', value: 'driver' },
  { label: 'Cleaners', value: 'cleaner' },
  { label: 'Managers', value: 'manager' },
];

const PAY_TYPE_LABEL: Record<PayType, string> = {
  hourly: '/hr',
  per_job: '/job',
  salary: '/yr',
};

export default function TeamScreen() {
  const { data: members, loading, refresh, create, update, remove } =
    useSupabaseCrud<TeamMember>('team_members', { orderBy: 'created_at' });
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { tokens, typography } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'driver' as TeamRole,
    pay_rate: '',
    pay_type: 'hourly' as PayType,
    is_active: true,
    notes: '',
  });

  const filteredMembers = useMemo(() => {
    if (activeTab === 'all') return members;
    return members.filter((m) => m.role === activeTab);
  }, [members, activeTab]);

  const activeCount = members.filter((m) => m.is_active).length;

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      role: 'driver',
      pay_rate: '',
      pay_type: 'hourly',
      is_active: true,
      notes: '',
    });
    setEditingMember(null);
  };

  const openEdit = (member: TeamMember) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      role: member.role,
      pay_rate: member.pay_rate?.toString() || '',
      pay_type: member.pay_type,
      is_active: member.is_active,
      notes: member.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      role: form.role,
      pay_rate: form.pay_rate ? parseFloat(form.pay_rate) : null,
      pay_type: form.pay_type,
      is_active: form.is_active,
      notes: form.notes || null,
    };

    if (editingMember) {
      await update(editingMember.id, payload);
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
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} tintColor={tokens.primary} />
        }
      >
        <ScreenHeader
          title="Team"
          subtitle={`${members.length} member${members.length !== 1 ? 's' : ''} · ${activeCount} active`}
          action={
            <Button
              title="Add Member"
              onPress={() => {
                resetForm();
                setShowModal(true);
              }}
              size="sm"
              icon={<Ionicons name="add" size={16} color={tokens.white} />}
            />
          }
        />

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            const count =
              tab.value === 'all'
                ? members.length
                : members.filter((m) => m.role === tab.value).length;

            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredMembers.length === 0 && !loading ? (
          <EmptyState
            icon="people-outline"
            title="No team members"
            description={
              activeTab === 'all'
                ? 'Add your first team member to manage your team'
                : `No ${activeTab}s found in your team`
            }
            actionLabel={activeTab === 'all' ? 'Add Member' : undefined}
            onAction={
              activeTab === 'all'
                ? () => {
                    resetForm();
                    setShowModal(true);
                  }
                : undefined
            }
          />
        ) : (
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {filteredMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                activeOpacity={0.7}
                onPress={() => openEdit(member)}
              >
                <Card style={styles.memberCard}>
                  <CardContent style={styles.memberContent}>
                    {/* Header row: icon + badge + active dot */}
                    <View style={styles.memberHeader}>
                      <View style={styles.memberIcon}>
                        <Ionicons
                          name={ROLE_ICON[member.role] as any}
                          size={22}
                          color={tokens.primary}
                        />
                      </View>
                      <View style={styles.memberHeaderRight}>
                        <Badge label={member.role} variant={ROLE_BADGE[member.role]} />
                        <View
                          style={[
                            styles.activeDot,
                            {
                              backgroundColor: member.is_active
                                ? tokens.success
                                : tokens.textMuted,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Name */}
                    <Text style={styles.memberName}>{member.name}</Text>

                    {/* Contact info */}
                    {member.email && (
                      <View style={styles.contactRow}>
                        <Ionicons name="mail-outline" size={13} color={tokens.textMuted} />
                        <Text style={styles.contactText} numberOfLines={1}>
                          {member.email}
                        </Text>
                      </View>
                    )}
                    {member.phone && (
                      <View style={styles.contactRow}>
                        <Ionicons name="call-outline" size={13} color={tokens.textMuted} />
                        <Text style={styles.contactText}>{member.phone}</Text>
                      </View>
                    )}

                    {/* Pay info */}
                    {member.pay_rate != null && (
                      <View style={styles.payRow}>
                        <Text style={styles.payRate}>
                          ${member.pay_rate.toFixed(2)}
                        </Text>
                        <Text style={styles.payType}>{PAY_TYPE_LABEL[member.pay_type]}</Text>
                      </View>
                    )}

                    {/* Status label */}
                    <Text
                      style={[
                        styles.statusLabel,
                        { color: member.is_active ? tokens.success : tokens.textMuted },
                      ]}
                    >
                      {member.is_active ? 'Active' : 'Inactive'}
                    </Text>

                    {/* Delete button */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => remove(member.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color={tokens.danger} />
                    </TouchableOpacity>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingMember ? 'Edit Team Member' : 'Add Team Member'}
        size="lg"
      >
        <Input
          label="Name"
          placeholder="Full name"
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
        />
        <View style={styles.formRow}>
          <Input
            label="Email"
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Phone"
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            containerStyle={styles.formHalf}
          />
        </View>
        <Select
          label="Role"
          options={ROLE_OPTIONS}
          value={form.role}
          onValueChange={(v) => setForm({ ...form, role: v as TeamRole })}
        />
        <View style={styles.formRow}>
          <Input
            label="Pay Rate ($)"
            placeholder="25.00"
            keyboardType="numeric"
            value={form.pay_rate}
            onChangeText={(v) => setForm({ ...form, pay_rate: v })}
            containerStyle={styles.formHalf}
          />
          <Select
            label="Pay Type"
            options={PAY_TYPE_OPTIONS}
            value={form.pay_type}
            onValueChange={(v) => setForm({ ...form, pay_type: v as PayType })}
            containerStyle={styles.formHalf}
          />
        </View>

        {/* Active toggle */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Active Status</Text>
            <Text style={styles.toggleHelper}>
              Inactive members won't appear in assignment lists
            </Text>
          </View>
          <Switch
            value={form.is_active}
            onValueChange={(v) => setForm({ ...form, is_active: v })}
            trackColor={{ false: tokens.surface, true: tokens.primaryMuted }}
            thumbColor={form.is_active ? tokens.primary : tokens.textMuted}
          />
        </View>

        <Input
          label="Notes"
          placeholder="Any notes about this team member"
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
            title={editingMember ? 'Save Changes' : 'Add Member'}
            onPress={handleSave}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing['5xl'],
    },

    // Filter tabs
    tabRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    tabActive: {
      backgroundColor: c.primaryMuted,
      borderColor: c.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textSecondary,
    },
    tabTextActive: {
      color: c.primary,
      fontWeight: '600',
    },
    tabCount: {
      backgroundColor: c.backgroundElevated,
      borderRadius: radius.full,
      paddingHorizontal: 6,
      paddingVertical: 1,
      minWidth: 20,
      alignItems: 'center',
    },
    tabCountActive: {
      backgroundColor: c.primary,
    },
    tabCountText: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textMuted,
    },
    tabCountTextActive: {
      color: c.white,
    },

    // Grid
    grid: {
      gap: spacing.md,
    },
    gridDesktop: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },

    // Member card
    memberCard: {
      minWidth: 280,
    },
    memberContent: {
      paddingTop: spacing.lg,
    },
    memberHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    memberIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: c.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    activeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    memberName: {
      ...typography.heading3,
      marginBottom: spacing.sm,
    },

    // Contact
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 4,
    },
    contactText: {
      ...typography.bodySmall,
      flex: 1,
    },

    // Pay
    payRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 2,
      marginTop: spacing.sm,
    },
    payRate: {
      fontSize: 16,
      fontWeight: '700',
      color: c.primary,
    },
    payType: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textMuted,
    },

    // Status
    statusLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    deleteBtn: {
      position: 'absolute',
      top: spacing.lg,
      right: 0,
      padding: spacing.xs,
    },

    // Form
    formRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    formHalf: {
      flex: 1,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    toggleLabel: {
      ...typography.label,
      marginBottom: 2,
    },
    toggleHelper: {
      fontSize: 12,
      color: c.textMuted,
    },
    formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
      marginTop: spacing.md,
    },
  });
}
