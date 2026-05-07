import React from 'react';
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
import { ScreenHeader } from '@/components/shared/screen-header';
import { KpiCard } from '@/components/charts/kpi-card';
import { AreaChart } from '@/components/charts/area-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { Heatmap } from '@/components/charts/heatmap';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { colors, spacing, typography, radius } from '@/lib/theme';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';

export default function DashboardScreen() {
  const { data, loading, refresh } = useDashboard();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const kpiColumns = isDesktop ? 4 : 2;

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ScreenHeader title="Dashboard" subtitle="Welcome back" />
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
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Dashboard" subtitle="Your fleet at a glance" />

        <View style={[styles.kpiGrid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
          <KpiCard
            label="YTD Revenue"
            value={formatCurrency(data.ytdRevenue)}
            change={data.revenueChange}
            changeLabel="vs last year"
            icon="trending-up"
            iconColor={colors.success}
            style={styles.kpiItem}
          />
          <KpiCard
            label="MTD Revenue"
            value={formatCurrency(data.mtdRevenue)}
            icon="cash-outline"
            iconColor={colors.chartBlue}
            style={styles.kpiItem}
          />
          <KpiCard
            label="YTD Profit"
            value={formatCurrency(data.ytdProfit)}
            change={data.profitChange}
            changeLabel="vs last year"
            icon="analytics-outline"
            iconColor={data.ytdProfit >= 0 ? colors.success : colors.danger}
            style={styles.kpiItem}
          />
          <KpiCard
            label="MTD Profit"
            value={formatCurrency(data.mtdProfit)}
            icon="pie-chart-outline"
            iconColor={data.mtdProfit >= 0 ? colors.success : colors.danger}
            style={styles.kpiItem}
          />
          <KpiCard
            label="Fleet Size"
            value={data.totalVehicles.toString()}
            icon="car-outline"
            iconColor={colors.primary}
            style={styles.kpiItem}
          />
          <KpiCard
            label="Active Bookings"
            value={data.activeBookings.toString()}
            icon="calendar-outline"
            iconColor={colors.chartOrange}
            style={styles.kpiItem}
          />
          <KpiCard
            label="Avg Daily Rate"
            value={formatCurrency(data.avgDailyRate)}
            icon="pricetag-outline"
            iconColor={colors.chartCyan}
            style={styles.kpiItem}
          />
          <KpiCard
            label="Utilization"
            value={formatPercent(data.utilization)}
            icon="speedometer-outline"
            iconColor={colors.chartPink}
            style={styles.kpiItem}
          />
        </View>

        <View style={[styles.chartsRow, isDesktop ? styles.chartsRowDesktop : undefined]}>
          <Card style={[styles.chartCard, isDesktop ? { flex: 2 } : undefined]}>
            <CardHeader title="Revenue & Profit" subtitle="Monthly trend this year" />
            <CardContent>
              <AreaChart
                data={data.monthlyData}
                showSecondary
                primaryLabel="Revenue"
                secondaryLabel="Profit"
                primaryColor={colors.primary}
                secondaryColor={colors.chartGreen}
              />
            </CardContent>
          </Card>

          <Card style={[styles.chartCard, isDesktop ? { flex: 1 } : undefined]}>
            <CardHeader title="Expenses by Category" subtitle="Year to date" />
            <CardContent>
              <DonutChart
                data={data.expenseBreakdown}
                centerValue={formatCurrency(data.ytdExpenses)}
                centerLabel="Total"
              />
            </CardContent>
          </Card>
        </View>

        <Card style={styles.chartCard}>
          <CardHeader title="Booking Activity" subtitle="Last 20 weeks" />
          <CardContent>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Heatmap data={data.heatmapData} />
            </ScrollView>
          </CardContent>
        </Card>

        <View style={[styles.chartsRow, isDesktop ? styles.chartsRowDesktop : undefined]}>
          <Card style={[styles.chartCard, isDesktop ? { flex: 1 } : undefined]}>
            <CardHeader title="Vehicle Performance" subtitle="Top earners this year" />
            <CardContent>
              {data.vehiclePerformance.length === 0 ? (
                <Text style={styles.emptyText}>No vehicle data yet</Text>
              ) : (
                <View style={styles.perfTable}>
                  <View style={styles.perfHeader}>
                    <Text style={[styles.perfHeaderCell, { flex: 2 }]}>Vehicle</Text>
                    <Text style={styles.perfHeaderCell}>Revenue</Text>
                    <Text style={styles.perfHeaderCell}>Trips</Text>
                    <Text style={styles.perfHeaderCell}>Profit</Text>
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
                          { color: v.profit >= 0 ? colors.success : colors.danger },
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
            <CardHeader title="Upcoming Bookings" subtitle="Next 5 reservations" />
            <CardContent>
              {data.upcomingBookings.length === 0 ? (
                <Text style={styles.emptyText}>No upcoming bookings</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    borderBottomColor: colors.border,
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
    borderBottomColor: colors.border,
  },
  perfCell: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  bookingVehicle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bookingRenter: {
    ...typography.caption,
    marginTop: 2,
  },
  bookingDate: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
