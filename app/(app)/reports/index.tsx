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
import { useSupabaseCrud, useSettings } from '@/hooks/useSupabaseCrud';
import { ScreenHeader } from '@/components/shared/screen-header';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/charts/kpi-card';
import { AreaChart } from '@/components/charts/area-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { spacing, radius } from '@/lib/theme';
import type { ColorTokens } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { Trip, Expense, Payout, Vehicle } from '@/types/database';

type TabKey = 'pnl' | 'vehicles' | 'tax';

const TABS: { key: TabKey; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'pnl', label: 'P&L', icon: 'stats-chart-outline' },
  { key: 'vehicles', label: 'Vehicles', icon: 'car-sport-outline' },
  { key: 'tax', label: 'Tax Forecast', icon: 'calculator-outline' },
];

// -- US Federal Tax Brackets (2024 Single) --
const US_FEDERAL_BRACKETS = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

// -- US State Average (simplified flat rate) --
const US_STATE_RATE = 0.05;

// -- Canada Federal Tax Brackets (2024) --
const CA_FEDERAL_BRACKETS = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 154906, rate: 0.26 },
  { min: 154906, max: 220000, rate: 0.29 },
  { min: 220000, max: Infinity, rate: 0.33 },
];

// -- Canada Provincial Average (simplified) --
const CA_PROVINCIAL_RATE = 0.10;

// -- CPP (Canada Pension Plan) 2024 --
const CPP_MAX_PENSIONABLE = 68500;
const CPP_BASIC_EXEMPTION = 3500;
const CPP_RATE = 0.1190; // combined employee + employer for self-employed

function calculateBracketTax(income: number, brackets: { min: number; max: number; rate: number }[]): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (income <= bracket.min) break;
    const taxable = Math.min(income, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return tax;
}

export default function ReportsScreen() {
  const { data: trips, refresh: refreshTrips } = useSupabaseCrud<Trip>('trips');
  const { data: expenses, refresh: refreshExpenses } = useSupabaseCrud<Expense>('expenses');
  const { data: payouts, refresh: refreshPayouts } = useSupabaseCrud<Payout>('payouts');
  const { data: vehicles, refresh: refreshVehicles } = useSupabaseCrud<Vehicle>('vehicles');
  const { settings } = useSettings();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { tokens, typography } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, typography), [tokens, typography]);

  const [activeTab, setActiveTab] = useState<TabKey>('pnl');

  const handleRefresh = () => {
    refreshTrips();
    refreshExpenses();
    refreshPayouts();
    refreshVehicles();
  };

  // Determine country from settings (default US)
  const country = (settings.country || 'US').toUpperCase();

  // ========== P&L CALCULATIONS ==========
  const pnl = useMemo(() => {
    const totalRevenue = trips.reduce((sum, t) => sum + (t.total_earnings || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
    const netProfit = totalRevenue - totalExpenses - totalPayouts;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Monthly revenue chart data
    const monthlyMap: Record<string, { revenue: number; profit: number }> = {};
    trips.forEach((t) => {
      const month = (t.start_date || t.created_at || '').substring(0, 7);
      if (!month) return;
      if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, profit: 0 };
      monthlyMap[month].revenue += t.total_earnings || 0;
    });
    expenses.forEach((e) => {
      const month = (e.date || e.created_at || '').substring(0, 7);
      if (!month) return;
      if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, profit: 0 };
      monthlyMap[month].profit -= e.amount;
    });
    payouts.forEach((p) => {
      const month = (p.date || p.created_at || '').substring(0, 7);
      if (!month) return;
      if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, profit: 0 };
      monthlyMap[month].profit -= p.amount;
    });
    // Add revenue to profit
    Object.keys(monthlyMap).forEach((m) => {
      monthlyMap[m].profit += monthlyMap[m].revenue;
    });

    const months = Object.keys(monthlyMap).sort();
    const chartData = months.map((m) => ({
      label: m.substring(5), // "MM"
      value: monthlyMap[m].revenue,
      secondaryValue: monthlyMap[m].profit,
    }));

    // Expense breakdown for donut
    const expenseByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category.replace(/_/g, ' ');
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + e.amount;
    });
    const DONUT_COLORS = [
      tokens.chartPurple, tokens.chartBlue, tokens.chartGreen,
      tokens.chartOrange, tokens.chartRed, tokens.chartPink,
      tokens.chartCyan, '#8B5CF6', '#14B8A6', '#F97316',
    ];
    const donutData = Object.entries(expenseByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value,
        color: DONUT_COLORS[i % DONUT_COLORS.length],
      }));

    return {
      totalRevenue,
      totalExpenses,
      totalPayouts,
      netProfit,
      margin,
      chartData,
      donutData,
    };
  }, [trips, expenses, payouts, tokens]);

  // ========== VEHICLE ANALYSIS ==========
  const vehicleAnalysis = useMemo(() => {
    return vehicles.map((v) => {
      const vName = `${v.year} ${v.make} ${v.model}`;
      const vTrips = trips.filter((t) => t.vehicle_id === v.id);
      const vExpenses = expenses.filter((e) => e.vehicle_id === v.id);

      const revenue = vTrips.reduce((s, t) => s + (t.total_earnings || 0), 0);
      const expenseTotal = vExpenses.reduce((s, e) => s + e.amount, 0);
      const profit = revenue - expenseTotal;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const roi =
        v.purchase_price && v.purchase_price > 0
          ? (profit / v.purchase_price) * 100
          : 0;
      const totalTrips = vTrips.length;

      return {
        id: v.id,
        name: vName,
        revenue,
        expenses: expenseTotal,
        profit,
        margin,
        roi,
        totalTrips,
        purchasePrice: v.purchase_price || 0,
      };
    }).sort((a, b) => b.profit - a.profit);
  }, [vehicles, trips, expenses]);

  // ========== TAX FORECAST ==========
  const taxForecast = useMemo(() => {
    const taxableIncome = Math.max(0, pnl.netProfit);

    let federalTax = 0;
    let stateTax = 0;
    let cpp = 0;
    let federalLabel = '';
    let secondaryLabel = '';

    if (country === 'CA') {
      federalTax = calculateBracketTax(taxableIncome, CA_FEDERAL_BRACKETS);
      stateTax = taxableIncome * CA_PROVINCIAL_RATE;
      federalLabel = 'Federal Tax (Canada)';
      secondaryLabel = 'Provincial Tax (Est.)';

      // CPP for self-employed
      const pensionableEarnings = Math.min(taxableIncome, CPP_MAX_PENSIONABLE);
      const cppContributable = Math.max(0, pensionableEarnings - CPP_BASIC_EXEMPTION);
      cpp = cppContributable * CPP_RATE;
    } else {
      federalTax = calculateBracketTax(taxableIncome, US_FEDERAL_BRACKETS);
      stateTax = taxableIncome * US_STATE_RATE;
      federalLabel = 'Federal Tax (US)';
      secondaryLabel = 'State Tax (Est. 5%)';
    }

    const totalTax = federalTax + stateTax + cpp;
    const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;
    const monthlySetAside = totalTax / 12;

    // Tax bracket bar chart
    const brackets = country === 'CA' ? CA_FEDERAL_BRACKETS : US_FEDERAL_BRACKETS;
    const bracketData = brackets
      .filter((b) => b.min < taxableIncome)
      .map((b) => {
        const taxable = Math.min(taxableIncome, b.max) - b.min;
        const tax = taxable * b.rate;
        return {
          label: `${(b.rate * 100).toFixed(0)}%`,
          value: tax,
          color: tax > 0 ? tokens.chartPurple : tokens.surface,
        };
      });

    return {
      taxableIncome,
      federalTax,
      stateTax,
      cpp,
      totalTax,
      effectiveRate,
      monthlySetAside,
      federalLabel,
      secondaryLabel,
      bracketData,
    };
  }, [pnl.netProfit, country, tokens]);

  // ========== RENDER ==========
  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={tokens.primary}
          />
        }
      >
        <ScreenHeader
          title="Reports"
          subtitle="Financial overview & analysis"
        />

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={
                  activeTab === tab.key ? tokens.primary : tokens.textMuted
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* P&L Tab */}
        {activeTab === 'pnl' && (
          <View style={styles.tabContent}>
            {/* KPI Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.kpiRow}
            >
              <KpiCard
                label="Total Revenue"
                value={formatCurrency(pnl.totalRevenue)}
                icon="trending-up-outline"
                iconColor={tokens.success}
                style={styles.kpiCard}
              />
              <KpiCard
                label="Total Expenses"
                value={formatCurrency(pnl.totalExpenses)}
                icon="trending-down-outline"
                iconColor={tokens.danger}
                style={styles.kpiCard}
              />
              <KpiCard
                label="Total Payouts"
                value={formatCurrency(pnl.totalPayouts)}
                icon="wallet-outline"
                iconColor={tokens.warning}
                style={styles.kpiCard}
              />
              <KpiCard
                label="Net Profit"
                value={formatCurrency(pnl.netProfit)}
                icon="cash-outline"
                iconColor={pnl.netProfit >= 0 ? tokens.success : tokens.danger}
                style={styles.kpiCard}
              />
            </ScrollView>

            {/* Revenue & Profit Chart */}
            <Card style={styles.chartCard}>
              <CardHeader
                title="Revenue & Profit"
                subtitle="Monthly trend"
              />
              <CardContent>
                {pnl.chartData.length > 0 ? (
                  <AreaChart
                    data={pnl.chartData}
                    height={220}
                    showSecondary
                    primaryColor={tokens.primary}
                    secondaryColor={tokens.chartGreen}
                    primaryLabel="Revenue"
                    secondaryLabel="Net Profit"
                  />
                ) : (
                  <Text style={styles.emptyChart}>
                    No data yet. Complete trips to see revenue trends.
                  </Text>
                )}
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card style={styles.chartCard}>
              <CardHeader
                title="Expense Breakdown"
                subtitle="By category"
              />
              <CardContent>
                {pnl.donutData.length > 0 ? (
                  <DonutChart
                    data={pnl.donutData}
                    size={180}
                    thickness={28}
                    centerLabel="Expenses"
                    centerValue={formatCurrency(pnl.totalExpenses)}
                  />
                ) : (
                  <Text style={styles.emptyChart}>
                    No expenses recorded yet.
                  </Text>
                )}
              </CardContent>
            </Card>

            {/* P&L Summary Table */}
            <Card style={styles.chartCard}>
              <CardHeader title="Profit & Loss Summary" />
              <CardContent>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Revenue (from trips)</Text>
                  <Text style={[styles.summaryValue, { color: tokens.success }]}>
                    {formatCurrency(pnl.totalRevenue)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Less: Expenses</Text>
                  <Text style={[styles.summaryValue, { color: tokens.danger }]}>
                    -{formatCurrency(pnl.totalExpenses)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Less: Payouts</Text>
                  <Text style={[styles.summaryValue, { color: tokens.danger }]}>
                    -{formatCurrency(pnl.totalPayouts)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>
                    Net Profit
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      {
                        fontWeight: '700',
                        color: pnl.netProfit >= 0 ? tokens.success : tokens.danger,
                      },
                    ]}
                  >
                    {formatCurrency(pnl.netProfit)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Margin</Text>
                  <Text style={styles.summaryValue}>
                    {formatPercent(pnl.margin)}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Vehicle Analysis Tab */}
        {activeTab === 'vehicles' && (
          <View style={styles.tabContent}>
            {vehicleAnalysis.length === 0 ? (
              <Card>
                <CardContent style={{ paddingTop: spacing.lg }}>
                  <Text style={styles.emptyChart}>
                    Add vehicles and record trips to see per-vehicle analysis.
                  </Text>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Top Vehicle KPIs */}
                {vehicleAnalysis.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.kpiRow}
                  >
                    <KpiCard
                      label="Fleet Revenue"
                      value={formatCurrency(
                        vehicleAnalysis.reduce((s, v) => s + v.revenue, 0)
                      )}
                      icon="car-sport-outline"
                      iconColor={tokens.success}
                      style={styles.kpiCard}
                    />
                    <KpiCard
                      label="Fleet Expenses"
                      value={formatCurrency(
                        vehicleAnalysis.reduce((s, v) => s + v.expenses, 0)
                      )}
                      icon="wallet-outline"
                      iconColor={tokens.danger}
                      style={styles.kpiCard}
                    />
                    <KpiCard
                      label="Fleet Profit"
                      value={formatCurrency(
                        vehicleAnalysis.reduce((s, v) => s + v.profit, 0)
                      )}
                      icon="trending-up-outline"
                      iconColor={tokens.primary}
                      style={styles.kpiCard}
                    />
                  </ScrollView>
                )}

                {/* Revenue by Vehicle Bar Chart */}
                <Card style={styles.chartCard}>
                  <CardHeader
                    title="Revenue by Vehicle"
                    subtitle="Comparison"
                  />
                  <CardContent>
                    <BarChart
                      data={vehicleAnalysis.map((v) => ({
                        label: v.name.length > 12
                          ? v.name.substring(0, 12)
                          : v.name,
                        value: v.revenue,
                        color: tokens.primary,
                      }))}
                      height={200}
                      barColor={tokens.primary}
                    />
                  </CardContent>
                </Card>

                {/* Vehicle Table */}
                <Card style={styles.chartCard}>
                  <CardHeader
                    title="Vehicle Performance"
                    subtitle={`${vehicleAnalysis.length} vehicle${vehicleAnalysis.length !== 1 ? 's' : ''}`}
                  />
                  <CardContent>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, styles.tableNameCol]}>
                        Vehicle
                      </Text>
                      <Text style={styles.tableHeaderCell}>Revenue</Text>
                      <Text style={styles.tableHeaderCell}>Expenses</Text>
                      <Text style={styles.tableHeaderCell}>Profit</Text>
                      {isDesktop && (
                        <>
                          <Text style={styles.tableHeaderCell}>ROI</Text>
                          <Text style={styles.tableHeaderCell}>Margin</Text>
                        </>
                      )}
                    </View>

                    {/* Table Rows */}
                    {vehicleAnalysis.map((v) => (
                      <View key={v.id} style={styles.tableRow}>
                        <View style={styles.tableNameCol}>
                          <Text style={styles.tableName} numberOfLines={1}>
                            {v.name}
                          </Text>
                          <Text style={styles.tableTrips}>
                            {v.totalTrips} trip{v.totalTrips !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <Text style={styles.tableCell}>
                          {formatCurrency(v.revenue)}
                        </Text>
                        <Text style={styles.tableCell}>
                          {formatCurrency(v.expenses)}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            {
                              color:
                                v.profit >= 0 ? tokens.success : tokens.danger,
                              fontWeight: '600',
                            },
                          ]}
                        >
                          {formatCurrency(v.profit)}
                        </Text>
                        {isDesktop && (
                          <>
                            <Text style={styles.tableCell}>
                              {formatPercent(v.roi)}
                            </Text>
                            <Text
                              style={[
                                styles.tableCell,
                                {
                                  color:
                                    v.margin >= 0
                                      ? tokens.success
                                      : tokens.danger,
                                },
                              ]}
                            >
                              {formatPercent(v.margin)}
                            </Text>
                          </>
                        )}
                      </View>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </View>
        )}

        {/* Tax Forecast Tab */}
        {activeTab === 'tax' && (
          <View style={styles.tabContent}>
            {/* Country Badge */}
            <View style={styles.countryRow}>
              <Badge
                label={country === 'CA' ? 'Canada' : 'United States'}
                variant="purple"
                size="md"
              />
              <Text style={styles.countryNote}>
                Based on your settings. Change country in Settings.
              </Text>
            </View>

            {/* Tax KPIs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.kpiRow}
            >
              <KpiCard
                label="Taxable Income"
                value={formatCurrency(taxForecast.taxableIncome)}
                icon="cash-outline"
                iconColor={tokens.primary}
                style={styles.kpiCard}
              />
              <KpiCard
                label="Estimated Tax"
                value={formatCurrency(taxForecast.totalTax)}
                icon="calculator-outline"
                iconColor={tokens.danger}
                style={styles.kpiCard}
              />
              <KpiCard
                label="Effective Rate"
                value={formatPercent(taxForecast.effectiveRate)}
                icon="analytics-outline"
                iconColor={tokens.warning}
                style={styles.kpiCard}
              />
              <KpiCard
                label="Monthly Set-Aside"
                value={formatCurrency(taxForecast.monthlySetAside)}
                icon="calendar-outline"
                iconColor={tokens.success}
                style={styles.kpiCard}
              />
            </ScrollView>

            {/* Tax Breakdown Card */}
            <Card style={styles.chartCard}>
              <CardHeader
                title="Tax Breakdown"
                subtitle={`Estimated for ${new Date().getFullYear()}`}
              />
              <CardContent>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Net Profit (Taxable)</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(taxForecast.taxableIncome)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {taxForecast.federalLabel}
                  </Text>
                  <Text style={[styles.summaryValue, { color: tokens.danger }]}>
                    {formatCurrency(taxForecast.federalTax)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {taxForecast.secondaryLabel}
                  </Text>
                  <Text style={[styles.summaryValue, { color: tokens.danger }]}>
                    {formatCurrency(taxForecast.stateTax)}
                  </Text>
                </View>
                {country === 'CA' && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      CPP Contributions (Self-Employed)
                    </Text>
                    <Text
                      style={[styles.summaryValue, { color: tokens.danger }]}
                    >
                      {formatCurrency(taxForecast.cpp)}
                    </Text>
                  </View>
                )}
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { fontWeight: '700' }]}
                  >
                    Total Estimated Tax
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { fontWeight: '700', color: tokens.danger },
                    ]}
                  >
                    {formatCurrency(taxForecast.totalTax)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Effective Tax Rate</Text>
                  <Text style={styles.summaryValue}>
                    {formatPercent(taxForecast.effectiveRate)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { fontWeight: '700' }]}
                  >
                    Recommended Monthly Set-Aside
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { fontWeight: '700', color: tokens.warning },
                    ]}
                  >
                    {formatCurrency(taxForecast.monthlySetAside)}
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* Tax Bracket Chart */}
            <Card style={styles.chartCard}>
              <CardHeader
                title="Tax by Bracket"
                subtitle={`${country === 'CA' ? 'Federal (Canada)' : 'Federal (US)'}`}
              />
              <CardContent>
                {taxForecast.bracketData.length > 0 ? (
                  <BarChart
                    data={taxForecast.bracketData}
                    height={180}
                    barColor={tokens.chartPurple}
                  />
                ) : (
                  <Text style={styles.emptyChart}>
                    No taxable income to display brackets.
                  </Text>
                )}
              </CardContent>
            </Card>

            {/* After-Tax Income */}
            <Card style={styles.chartCard}>
              <CardHeader title="Income After Tax" />
              <CardContent>
                <DonutChart
                  data={[
                    {
                      label: 'Take-Home',
                      value: Math.max(
                        0,
                        taxForecast.taxableIncome - taxForecast.totalTax
                      ),
                      color: tokens.chartGreen,
                    },
                    {
                      label: 'Tax',
                      value: taxForecast.totalTax,
                      color: tokens.chartRed,
                    },
                  ]}
                  size={160}
                  thickness={24}
                  centerLabel="After Tax"
                  centerValue={formatCurrency(
                    Math.max(0, taxForecast.taxableIncome - taxForecast.totalTax)
                  )}
                />
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <View style={styles.disclaimerContainer}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={tokens.textMuted}
              />
              <Text style={styles.disclaimerText}>
                These are simplified estimates based on current brackets and
                rates. Consult a tax professional for accurate filing. State/
                provincial rates use averages and may differ from your
                jurisdiction.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTokens, typography: ReturnType<typeof import('@/lib/theme').makeTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },

    // Tab Bar
    tabBar: {
      flexDirection: 'row',
      backgroundColor: c.backgroundCard,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.xs,
      marginBottom: spacing.xl,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    tabActive: {
      backgroundColor: c.primaryMuted,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textMuted,
    },
    tabTextActive: {
      color: c.primary,
      fontWeight: '600',
    },
    tabContent: { gap: spacing.lg },

    // KPIs
    kpiRow: { gap: spacing.md, paddingBottom: spacing.sm },
    kpiCard: { minWidth: 155 },

    // Cards
    chartCard: { marginBottom: 0 },
    emptyChart: {
      ...typography.bodySmall,
      textAlign: 'center',
      paddingVertical: spacing['3xl'],
    },

    // P&L Summary Rows
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    summaryLabel: {
      ...typography.body,
      flex: 1,
    },
    summaryValue: {
      fontSize: 15,
      fontWeight: '500',
      color: c.text,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: spacing.xs,
    },

    // Vehicle Table
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      marginBottom: spacing.xs,
    },
    tableHeaderCell: {
      ...typography.caption,
      flex: 1,
      textAlign: 'right',
    },
    tableNameCol: {
      flex: 2,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    tableName: {
      fontSize: 13,
      fontWeight: '500',
      color: c.text,
    },
    tableTrips: {
      ...typography.caption,
      marginTop: 1,
    },
    tableCell: {
      flex: 1,
      fontSize: 13,
      color: c.text,
      textAlign: 'right',
    },

    // Tax Country
    countryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    countryNote: {
      ...typography.caption,
      flex: 1,
    },

    // Disclaimer
    disclaimerContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    disclaimerText: {
      ...typography.caption,
      flex: 1,
      lineHeight: 18,
    },
  });
}
