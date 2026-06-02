import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Card, CardContent } from '@/components/ui/card';
import { spacing, radius } from '@/lib/theme';
import type { ColorTokens } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';

const PRE_TRIP_STEPS = [
  'Exterior photos — all 4 sides + close-ups of any damage',
  'Check tire pressure on all 4 tires',
  'Check tire tread depth',
  'Check all fluids — oil, coolant, washer fluid',
  'Check dashboard for warning lights',
  'Verify fuel level',
  'Test all lights — headlights, brake, turn signals, hazards',
  'Check windshield wipers',
  'Verify registration and insurance docs in glove box',
  'Check spare tire and jack',
  'Test horn',
  'Check mirrors adjustment',
  'Verify Bluetooth / infotainment system',
  'Check all seat belts',
  'Note any pre-existing damage',
  'Verify interior cleanliness',
  'Record starting odometer',
  'Take key photo',
];

const POST_TRIP_STEPS = [
  'Exterior walk-around inspection',
  'Photograph any new damage',
  'Check interior for personal items left behind',
  'Check interior for damage or stains',
  'Check fuel level',
  'Record ending odometer',
  'Check tire condition',
  'Verify all accessories returned',
  'Clean interior — vacuum and wipe surfaces',
  'Check trunk / cargo area',
  'Take photos of interior condition',
  'Verify key returned',
  'Note any issues or concerns',
  'Check for smoking smell',
  'Wash exterior if needed',
  'Update vehicle status',
];

type ChecklistTab = 'pre' | 'post';

export default function ChecklistsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { tokens: colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);
  const [activeTab, setActiveTab] = useState<ChecklistTab>('pre');
  const [preChecked, setPreChecked] = useState<boolean[]>(
    new Array(PRE_TRIP_STEPS.length).fill(false)
  );
  const [postChecked, setPostChecked] = useState<boolean[]>(
    new Array(POST_TRIP_STEPS.length).fill(false)
  );

  const steps = activeTab === 'pre' ? PRE_TRIP_STEPS : POST_TRIP_STEPS;
  const checked = activeTab === 'pre' ? preChecked : postChecked;
  const setChecked = activeTab === 'pre' ? setPreChecked : setPostChecked;

  const completedCount = checked.filter(Boolean).length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const toggleItem = (index: number) => {
    const next = [...checked];
    next[index] = !next[index];
    setChecked(next);
  };

  const resetChecklist = () => {
    setChecked(new Array(steps.length).fill(false));
  };

  const markAllComplete = () => {
    setChecked(new Array(steps.length).fill(true));
  };

  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="Checklists"
          subtitle="Pre-trip & post-trip inspection guides"
        />

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pre' && styles.tabActive]}
            onPress={() => setActiveTab('pre')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-up-circle-outline"
              size={18}
              color={activeTab === 'pre' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'pre' && styles.tabTextActive,
              ]}
            >
              Pre-Trip
            </Text>
            <View
              style={[
                styles.tabCount,
                activeTab === 'pre' && styles.tabCountActive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === 'pre' && styles.tabCountTextActive,
                ]}
              >
                {PRE_TRIP_STEPS.length}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'post' && styles.tabActive]}
            onPress={() => setActiveTab('post')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-down-circle-outline"
              size={18}
              color={activeTab === 'post' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'post' && styles.tabTextActive,
              ]}
            >
              Post-Trip
            </Text>
            <View
              style={[
                styles.tabCount,
                activeTab === 'post' && styles.tabCountActive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === 'post' && styles.tabCountTextActive,
                ]}
              >
                {POST_TRIP_STEPS.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Progress Section */}
        <Card style={styles.progressCard}>
          <CardContent style={styles.progressContent}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressTitle}>
                  {activeTab === 'pre' ? 'Pre-Trip Inspection' : 'Post-Trip Inspection'}
                </Text>
                <Text style={styles.progressSubtitle}>
                  {completedCount} of {totalCount} steps completed
                </Text>
              </View>
              <View style={styles.progressPercent}>
                <Text style={styles.progressPercentText}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress * 100}%` },
                  progress === 1 && styles.progressBarComplete,
                ]}
              />
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={resetChecklist}
              >
                <Ionicons
                  name="refresh-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.actionBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={markAllComplete}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.actionBtnText}>Mark All</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Checklist Items */}
        <View style={styles.checklistContainer}>
          {steps.map((step, index) => {
            const isChecked = checked[index];
            return (
              <TouchableOpacity
                key={index}
                style={styles.checklistItem}
                onPress={() => toggleItem(index)}
                activeOpacity={0.6}
              >
                <View
                  style={[
                    styles.numberCircle,
                    isChecked && styles.numberCircleChecked,
                  ]}
                >
                  {isChecked ? (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.white}
                    />
                  ) : (
                    <Text style={styles.numberText}>{index + 1}</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    isChecked && styles.stepTextChecked,
                  ]}
                >
                  {step}
                </Text>
                <TouchableOpacity
                  style={styles.checkBtn}
                  onPress={() => toggleItem(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={isChecked ? colors.success : colors.textMuted}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Completion Banner */}
        {progress === 1 && (
          <View style={styles.completionBanner}>
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={colors.success}
            />
            <View style={styles.completionTextWrap}>
              <Text style={styles.completionTitle}>
                {activeTab === 'pre' ? 'Pre-Trip' : 'Post-Trip'} Complete!
              </Text>
              <Text style={styles.completionSubtitle}>
                All {totalCount} inspection steps have been completed.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },

  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  tabCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  tabCountActive: { backgroundColor: colors.primary },
  tabCountText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  tabCountTextActive: { color: colors.white },

  /* Progress */
  progressCard: { marginBottom: spacing.lg },
  progressContent: { paddingTop: spacing.lg },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: { ...typography.heading3, marginBottom: 2 },
  progressSubtitle: { ...typography.caption },
  progressPercent: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressBarComplete: { backgroundColor: colors.success },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  actionBtnText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },

  /* Checklist Items */
  checklistContainer: { gap: 2 },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundCard,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberCircleChecked: {
    backgroundColor: colors.success,
  },
  numberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 20,
  },
  stepTextChecked: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  checkBtn: {
    padding: 2,
  },

  /* Completion Banner */
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: colors.success,
  },
  completionTextWrap: { flex: 1 },
  completionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 2,
  },
  completionSubtitle: {
    fontSize: 13,
    color: colors.success,
    opacity: 0.8,
  },
  });
}
