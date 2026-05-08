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
import type { Renter } from '@/types/database';

const FLAG_OPTIONS = [
  { label: 'No', value: 'false' },
  { label: 'Yes', value: 'true' },
];

export default function RentersScreen() {
  const { data: renters, loading, refresh, create, update, remove } =
    useSupabaseCrud<Renter>('renters', { orderBy: 'created_at' });
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { tokens, typography } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Renter | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    turo_username: '',
    drivers_license: '',
    total_trips: '0',
    average_rating: '',
    is_flagged: 'false',
    flag_reason: '',
    address: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      turo_username: '',
      drivers_license: '',
      total_trips: '0',
      average_rating: '',
      is_flagged: 'false',
      flag_reason: '',
      address: '',
      notes: '',
    });
    setEditing(null);
  };

  const openEdit = (r: Renter) => {
    setEditing(r);
    setForm({
      name: r.name,
      email: r.email || '',
      phone: r.phone || '',
      turo_username: r.turo_username || '',
      drivers_license: r.drivers_license || '',
      total_trips: r.total_trips.toString(),
      average_rating: r.average_rating?.toString() || '',
      is_flagged: r.is_flagged ? 'true' : 'false',
      flag_reason: r.flag_reason || '',
      address: r.address || '',
      notes: r.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      turo_username: form.turo_username || null,
      drivers_license: form.drivers_license || null,
      total_trips: parseInt(form.total_trips) || 0,
      average_rating: form.average_rating ? parseFloat(form.average_rating) : null,
      is_flagged: form.is_flagged === 'true',
      flag_reason: form.is_flagged === 'true' ? form.flag_reason || null : null,
      address: form.address || null,
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

  const renderStars = (rating: number | null) => {
    if (rating == null) return null;
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const stars = [];
    for (let i = 0; i < full; i++) {
      stars.push(
        <Ionicons key={`f${i}`} name="star" size={12} color={tokens.warning} />
      );
    }
    if (half) {
      stars.push(
        <Ionicons key="h" name="star-half" size={12} color={tokens.warning} />
      );
    }
    return (
      <View style={styles.starsRow}>
        {stars}
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  const flaggedCount = renters.filter((r) => r.is_flagged).length;

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
          title="Renters"
          subtitle={`${renters.length} renter${renters.length !== 1 ? 's' : ''}${flaggedCount > 0 ? ` · ${flaggedCount} flagged` : ''}`}
          action={
            <Button
              title="Add Renter"
              onPress={() => {
                resetForm();
                setShowModal(true);
              }}
              size="sm"
              icon={<Ionicons name="add" size={16} color={tokens.white} />}
            />
          }
        />

        {renters.length === 0 && !loading ? (
          <EmptyState
            icon="people-outline"
            title="No renters yet"
            description="Add your first renter to keep track of your guests"
            actionLabel="Add Renter"
            onAction={() => {
              resetForm();
              setShowModal(true);
            }}
          />
        ) : (
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {renters.map((r) => (
              <TouchableOpacity
                key={r.id}
                activeOpacity={0.7}
                onPress={() => openEdit(r)}
              >
                <Card style={styles.renterCard}>
                  <CardContent style={styles.renterContent}>
                    <View style={styles.renterHeader}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                          {r.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </Text>
                      </View>
                      <View style={styles.headerBadges}>
                        {r.is_flagged && (
                          <Badge label="Flagged" variant="danger" />
                        )}
                      </View>
                    </View>
                    <Text style={styles.renterName}>{r.name}</Text>
                    {r.email && (
                      <View style={styles.infoRow}>
                        <Ionicons
                          name="mail-outline"
                          size={13}
                          color={tokens.textMuted}
                        />
                        <Text style={styles.infoText}>{r.email}</Text>
                      </View>
                    )}
                    {r.phone && (
                      <View style={styles.infoRow}>
                        <Ionicons
                          name="call-outline"
                          size={13}
                          color={tokens.textMuted}
                        />
                        <Text style={styles.infoText}>{r.phone}</Text>
                      </View>
                    )}
                    <View style={styles.renterStats}>
                      <View style={styles.stat}>
                        <Text style={styles.statLabel}>Trips</Text>
                        <Text style={styles.statValue}>{r.total_trips}</Text>
                      </View>
                      <View style={styles.stat}>
                        <Text style={styles.statLabel}>Rating</Text>
                        {r.average_rating != null ? (
                          renderStars(r.average_rating)
                        ) : (
                          <Text style={styles.statValue}>--</Text>
                        )}
                      </View>
                    </View>
                    {r.is_flagged && r.flag_reason && (
                      <View style={styles.flagBanner}>
                        <Ionicons
                          name="warning"
                          size={13}
                          color={tokens.danger}
                        />
                        <Text style={styles.flagText}>{r.flag_reason}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => remove(r.id)}
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
        title={editing ? 'Edit Renter' : 'Add Renter'}
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
        <View style={styles.formRow}>
          <Input
            label="Turo Username"
            placeholder="@username"
            value={form.turo_username}
            onChangeText={(v) => setForm({ ...form, turo_username: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Driver's License"
            placeholder="DL number"
            value={form.drivers_license}
            onChangeText={(v) => setForm({ ...form, drivers_license: v })}
            containerStyle={styles.formHalf}
          />
        </View>
        <Input
          label="Address"
          placeholder="Full address"
          value={form.address}
          onChangeText={(v) => setForm({ ...form, address: v })}
        />
        <View style={styles.formRow}>
          <Input
            label="Total Trips"
            placeholder="0"
            keyboardType="numeric"
            value={form.total_trips}
            onChangeText={(v) => setForm({ ...form, total_trips: v })}
            containerStyle={styles.formHalf}
          />
          <Input
            label="Average Rating"
            placeholder="4.5"
            keyboardType="numeric"
            value={form.average_rating}
            onChangeText={(v) => setForm({ ...form, average_rating: v })}
            containerStyle={styles.formHalf}
          />
        </View>
        <Select
          label="Flagged?"
          options={FLAG_OPTIONS}
          value={form.is_flagged}
          onValueChange={(v) => setForm({ ...form, is_flagged: v })}
        />
        {form.is_flagged === 'true' && (
          <Input
            label="Flag Reason"
            placeholder="Reason for flagging this renter"
            value={form.flag_reason}
            onChangeText={(v) => setForm({ ...form, flag_reason: v })}
          />
        )}
        <Input
          label="Notes"
          placeholder="Any notes about this renter"
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
            title={editing ? 'Save Changes' : 'Add Renter'}
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
    renterCard: { minWidth: 280 },
    renterContent: { paddingTop: spacing.lg },
    renterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 15,
      fontWeight: '700',
      color: c.primary,
    },
    headerBadges: { flexDirection: 'row', gap: spacing.xs },
    renterName: { ...typography.heading3, marginBottom: 4 },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 3,
    },
    infoText: { ...typography.bodySmall },
    renterStats: {
      flexDirection: 'row',
      gap: spacing.xl,
      marginTop: spacing.md,
    },
    stat: {},
    statLabel: { ...typography.caption, marginBottom: 2 },
    statValue: { fontSize: 15, fontWeight: '600', color: c.text },
    starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    ratingText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
      marginLeft: 4,
    },
    flagBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: c.dangerMuted,
      borderRadius: radius.sm,
    },
    flagText: { fontSize: 12, color: c.danger, flex: 1 },
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
