import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboard } from '@/hooks/useDashboard';
import { useTheme } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LocaleProvider';
import { ScreenHeader } from '@/components/shared/screen-header';
import { MaintenanceReminderBanner } from '@/components/shared/maintenance-reminder-banner';
import { KpiCard } from '@/components/charts/kpi-card';
import { AreaChart } from '@/components/charts/area-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { Heatmap } from '@/components/charts/heatmap';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/ui/skeleton';
import { spacing, radius } from '@/lib/theme';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import type { ColorTokens } from '@/lib/theme';

export default function DashboardScreen() {
  const { data, loading, refresh } = useDashboard();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { tokens, typography } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ScreenHeader title={t('dashboard.title')} subtitle={t('common.welcome_back')} />
          <View style={[styles.kpiGrid, { gap: spacing.md }]}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={tokens.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

        <MaintenanceReminderBanner />

        <View style={[styles.kpiGrid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
          <KpiCard
            label={t('dashboard.ytd_revenue')}
            value={formatCurrency(data.ytdRevenue)}
            change={data.revenueChange}
            changeLabel={t('dashboard.vs_last_year')}
            icon="trending-up"
            iconColor={tokens.success}
            style={styles.kpiItem}
          />
          <KpiCard
            label={t('dashboard.mtd_revenue')}
            value={formatCurrency(data.mtdRevenue)}
            icon="cash-outline"
            iconColor={tokens.chartBlue}
            style={styles.kpiItem}
          />
          <KpiCard
            label={t('dashboard.ytd_profit')}
            value={formatCurrency(data.ytdProfit)}
            change={data.profitChange}
            changeLabel={t('dashboard.vs_last_year')}
            icon="analytics-outline"
            iconColor={data.ytdProfit >= 0 ? tokens.success : tokens.danger}
            style={styles.kpiItem}
          />
          <KpiCard
            label={t('dashboard.mtd_profit')}
            value={formatCurrency(data.mtdProfit)}
            icon="pie-chart-outline"
            iconColor={data.mtdProfit >= 0 ? tokens.success : tokens.danger}
            style={styles.kpiItem}
          />
          <KpiCard
            label={t('dashboard.fleet_size')}
            value={data.totalVehicles.toString()}
            icon="car-outline"
            iconColor={tokens.primary}
            style={styles.kpiItem}
          />
          <KpiCard
            label={t('dashboard.active_bookings')}
            value={data.activeBookings.toString()}
            icon="calendar-outline"
            iconColor={tokens.chartOrange}
            style={styles.kpiItem}
          />
          <KpiCard
            label={t('dashboard.avg_daily_rate')}
            value={formatCurrency(data.avgDailyRate)}
            icon="pricetag-outline"
            iconColor={tokens.chartCyan}
            style={styles.kpiItem}
          />
          <KpiCard
            label={t('dashboard.utilization')}
            value={formatPercent(data.utilization)}
            icon="speedometer-outline"
            iconColor={tokens.chartPink}
            style={styles.kpiItem}
          />
        </View>

        <View style={[styles.chartsRow, isDesktop ? styles.chartsRowDesktop : undefined]}>
          <Card style={[styles.chartCard, isDesktop ? { flex: 2 } : undefined]}>
            <CardHeader
              title={t('dashboard.revenue_profit')}
              subtitle={t('dashboard.revenue_profit_subtitle')}
            />
            <CardContent>
              <AreaChart
                data={data.monthlyData}
                showSecondary
                primaryLabel={t('dashboard.revenue')}
                secondaryLabel={t('dashboard.profit')}
                primaryColor={tokens.primary}
                secondaryColor={tokens.chartGreen}
              />
            </CardContent>
          </Card>

          <Card style={[styles.chartCard, isDesktop ? { flex: 1 } : undefined]}>
            <CardHeader
              title={t('dashboard.expenses_by_category')}
              subtitle={t('dashboard.expenses_subtitle')}
            />
            <CardContent>
              <DonutChart
                data={data.expenseBreakdown}
                centerValue={formatCurrency(data.ytdExpenses)}
                centerLabel={t('common.total')}
              />
            </CardContent>
          </Card>
        </View>

        <Card style={styles.chartCard}>
          <CardHeader
            title={t('dashboard.booking_activity')}
            subtitle={t('dashboard.booking_activity_subtitle')}
          />
          <CardContent>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Heatmap data={data.heatmapData} />
            </ScrollView>
          </CardContent>
        </Card>

        <View style={[styles.chartsRow, isDesktop ? styles.chartsRowDesktop : undefined]}>
          <Card style={[styles.chartCard, isDesktop ? { flex: 1 } : undefined]}>
            <CardHeader
              title={t('dashboard.vehicle_performance')}
              subtitle={t('dashboard.vehicle_performance_subtitle')}
            />
            <CardContent>
              {data.vehiclePerformance.length === 0 ? (
                <Text style={styles.emptyText}>{t('dashboard.no_vehicle_data')}</Text>
              ) : (
                <View style={styles.perfTable}>
                  <View style={styles.perfHeader}>
                    <Text style={[styles.perfHeaderCell, { flex: 2 }]}>{t('dashboard.vehicle')}</Text>
                    <Text style={styles.perfHeaderCell}>{t('dashboard.revenue')}</Text>
                    <Text style={styles.perfHeaderCell}>{t('dashboard.trips')}</Text>
                    <Text style={styles.perfHeaderCell}>{t('dashboard.profit')}</Text>
                  </View>
                  {data.vehiclePerformance.map((v, i) => (
                    <View key={i} style={styles.perfRow}>
                      <Text style={[styles.perfCell, { flex: 2 }]} numberOfLines={1}>
                        {v.name}
                      </Text>
                      <Text style={styles.perfCell}>{formatCurrency(v.revenue)}</Text>
                      <Text style={styles.perfCell}>{v.trips}</Text>
                      <Text
                        style={[
                          styles.perfCell,
                          { color: v.profit >= 0 ? tokens.success : tokens.danger },
                        ]}
                      >
                        {formatCurrency(v.profit)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>

          <Card style={[styles.chartCard, isDesktop ? { flex: 1 } : undefined]}>
            <CardHeader
              title={t('dashboard.upcoming_bookings')}
              subtitle={t('dashboard.upcoming_bookings_subtitle')}
            />
            <CardContent>
              {data.upcomingBookings.length === 0 ? (
                <Text style={styles.emptyText}>{t('dashboard.no_upcoming')}</Text>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  {data.upcomingBookings.map((b) => (
                    <View key={b.id} style={styles.bookingRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bookingVehicle}>{b.vehicle}</Text>
                        <Text style={styles.bookingRenter}>{b.renter}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.bookingDate}>{formatDate(b.date, 'MMM d')}</Text>
                        <Badge label={`${b.days}d`} variant="purple" />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        </View>
      </ScrollView>
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
    kpiGrid: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    kpiItem: {
      flexBasis: '48%',
      flexGrow: 1,
      minWidth: 150,
    },
    chartsRow: {
      gap: spacing.lg,
      marginBottom: spacing.lg,
    },
    chartsRowDesktop: {
      flexDirection: 'row',
    },
    chartCard: {
      marginBottom: spacing.lg,
    },
    emptyText: {
      ...typography.bodySmall,
      textAlign: 'center',
      paddingVertical: spacing.xl,
    },
    perfTable: {
      gap: 0,
    },
    perfHeader: {
      flexDirection: 'row',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    perfHeaderCell: {
      ...typography.caption,
      flex: 1,
      textAlign: 'right',
    },
    perfRow: {
      flexDirection: 'row',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    perfCell: {
      fontSize: 13,
      color: c.text,
      flex: 1,
      textAlign: 'right',
    },
    bookingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.md,
    },
    bookingVehicle: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
    bookingRenter: {
      ...typography.caption,
      marginTop: 2,
    },
    bookingDate: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textSecondary,
      marginBottom: 4,
    },
  });
}
