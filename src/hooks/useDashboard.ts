import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  format,
  startOfMonth,
  startOfYear,
  subYears,
  eachMonthOfInterval,
  differenceInCalendarDays,
  isValid,
  parseISO,
} from 'date-fns';
import { safePercent, daysBetween } from '@/lib/utils';

interface DashboardData {
  ytdRevenue: number;
  mtdRevenue: number;
  ytdExpenses: number;
  mtdExpenses: number;
  ytdPayouts: number;
  mtdPayouts: number;
  ytdProfit: number;
  mtdProfit: number;
  totalVehicles: number;
  activeBookings: number;
  avgDailyRate: number;
  utilization: number;
  revenueChange: number;
  profitChange: number;
  monthlyData: { label: string; value: number; secondaryValue: number }[];
  expenseBreakdown: { label: string; value: number; color: string }[];
  vehiclePerformance: { name: string; revenue: number; trips: number; profit: number }[];
  upcomingBookings: { id: string; vehicle: string; renter: string; date: string; days: number }[];
  heatmapData: { date: string; count: number }[];
}

const EXPENSE_COLORS: Record<string, string> = {
  fuel: '#3B82F6',
  insurance: '#8B5CF6',
  maintenance: '#F59E0B',
  cleaning: '#06B6D4',
  financing: '#EC4899',
  registration: '#14B8A6',
  tolls_tickets: '#EF4444',
  supplies: '#22C55E',
  other: '#71717A',
};

function pickDate(...candidates: (string | null | undefined)[]): string {
  for (const c of candidates) {
    if (typeof c === 'string' && c.length >= 10) return c.slice(0, 10);
  }
  return '';
}

export function useDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const yearStart = format(startOfYear(now), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const prevYearStart = format(startOfYear(subYears(now, 1)), 'yyyy-MM-dd');
      const prevYearEnd = format(startOfYear(now), 'yyyy-MM-dd');

      const [tripsRes, expensesRes, vehiclesRes, bookingsRes, payoutsRes] = await Promise.all([
        supabase.from('trips').select('*').eq('user_id', user.id).gte('start_date', prevYearStart),
        supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', prevYearStart),
        supabase.from('vehicles').select('*').eq('user_id', user.id),
        supabase.from('bookings').select('*').eq('user_id', user.id),
        supabase.from('payouts').select('*').eq('user_id', user.id).gte('date', prevYearStart),
      ]);

      const trips = (tripsRes.data ?? []) as any[];
      const expenses = (expensesRes.data ?? []) as any[];
      const vehicles = (vehiclesRes.data ?? []) as any[];
      const bookings = (bookingsRes.data ?? []) as any[];
      const payouts = (payoutsRes.data ?? []) as any[];

      const ytdTrips = trips.filter((t) => pickDate(t.start_date) >= yearStart);
      const mtdTrips = ytdTrips.filter((t) => pickDate(t.start_date) >= monthStart);
      const prevYearTrips = trips.filter((t) => {
        const d = pickDate(t.start_date);
        return d >= prevYearStart && d < prevYearEnd;
      });

      const ytdExpensesList = expenses.filter((e) => pickDate(e.date, e.created_at) >= yearStart);
      const mtdExpensesList = ytdExpensesList.filter((e) => pickDate(e.date, e.created_at) >= monthStart);
      const prevYearExpensesList = expenses.filter((e) => {
        const d = pickDate(e.date, e.created_at);
        return d >= prevYearStart && d < prevYearEnd;
      });

      const ytdPayoutsList = payouts.filter((p) => pickDate(p.date, p.created_at) >= yearStart);
      const mtdPayoutsList = ytdPayoutsList.filter((p) => pickDate(p.date, p.created_at) >= monthStart);

      const sum = (rows: any[], field: string) =>
        rows.reduce((s, r) => s + (Number.isFinite(r[field]) ? r[field] : 0), 0);

      const ytdRevenue = sum(ytdTrips, 'total_earnings');
      const mtdRevenue = sum(mtdTrips, 'total_earnings');
      const ytdExpenses = sum(ytdExpensesList, 'amount');
      const mtdExpenses = sum(mtdExpensesList, 'amount');
      const ytdPayouts = sum(ytdPayoutsList, 'amount');
      const mtdPayouts = sum(mtdPayoutsList, 'amount');

      const prevYearRevenue = sum(prevYearTrips, 'total_earnings');
      const prevYearExpenses = sum(prevYearExpensesList, 'amount');
      const prevYearProfit = prevYearRevenue - prevYearExpenses;

      const ytdProfit = ytdRevenue - ytdExpenses - ytdPayouts;
      const mtdProfit = mtdRevenue - mtdExpenses - mtdPayouts;

      const revenueChange = prevYearRevenue > 0
        ? ((ytdRevenue - prevYearRevenue) / prevYearRevenue) * 100
        : 0;

      const profitChange = Math.abs(prevYearProfit) > 0
        ? ((ytdProfit - prevYearProfit) / Math.abs(prevYearProfit)) * 100
        : 0;

      const activeVehicles = vehicles.filter((v) => v.status !== 'retired');
      const listedVehicles = activeVehicles.filter((v) => v.status === 'available' || v.status === 'rented');
      const avgDailyRate = listedVehicles.length > 0
        ? listedVehicles.reduce((s, v) => s + (Number.isFinite(v.daily_rate) ? v.daily_rate : 0), 0) /
          listedVehicles.length
        : 0;

      const totalTripDays = ytdTrips.reduce((s, t) => {
        const d = Number.isFinite(t.days) && t.days > 0
          ? t.days
          : daysBetween(t.start_date, t.end_date);
        return s + d;
      }, 0);

      const yearStartDate = startOfYear(now);
      const daysElapsedYTD = Math.max(1, differenceInCalendarDays(now, yearStartDate) + 1);
      const fleetCapacityDays = listedVehicles.length * daysElapsedYTD;
      const utilization = safePercent(totalTripDays, fleetCapacityDays);

      const months = eachMonthOfInterval({ start: startOfYear(now), end: now });
      const monthlyData = months.map((m) => {
        const key = format(m, 'yyyy-MM');
        const label = format(m, 'MMM');
        const rev = ytdTrips
          .filter((t) => pickDate(t.start_date).startsWith(key))
          .reduce((s, t) => s + (t.total_earnings || 0), 0);
        const exp = ytdExpensesList
          .filter((e) => pickDate(e.date, e.created_at).startsWith(key))
          .reduce((s, e) => s + (e.amount || 0), 0);
        const pay = ytdPayoutsList
          .filter((p) => pickDate(p.date, p.created_at).startsWith(key))
          .reduce((s, p) => s + (p.amount || 0), 0);
        return { label, value: rev, secondaryValue: rev - exp - pay };
      });

      const expenseMap = new Map<string, number>();
      ytdExpensesList.forEach((e) => {
        if (!e.category) return;
        expenseMap.set(e.category, (expenseMap.get(e.category) || 0) + (e.amount || 0));
      });
      const expenseBreakdown = Array.from(expenseMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([cat, val]) => ({
          label: cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          value: val,
          color: EXPENSE_COLORS[cat] || '#71717A',
        }));

      const vehicleMap = new Map<string, { revenue: number; trips: number; expenses: number }>();
      vehicles.forEach((v) => {
        vehicleMap.set(v.id, { revenue: 0, trips: 0, expenses: 0 });
      });
      ytdTrips.forEach((t) => {
        if (t.vehicle_id && vehicleMap.has(t.vehicle_id)) {
          const entry = vehicleMap.get(t.vehicle_id)!;
          entry.revenue += t.total_earnings || 0;
          entry.trips += 1;
        }
      });
      ytdExpensesList.forEach((e) => {
        if (e.vehicle_id && vehicleMap.has(e.vehicle_id)) {
          vehicleMap.get(e.vehicle_id)!.expenses += e.amount || 0;
        }
      });
      const vehiclePerformance = vehicles
        .map((v) => {
          const perf = vehicleMap.get(v.id) || { revenue: 0, trips: 0, expenses: 0 };
          return {
            name: `${v.year} ${v.make} ${v.model}`,
            revenue: perf.revenue,
            trips: perf.trips,
            profit: perf.revenue - perf.expenses,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const today = format(now, 'yyyy-MM-dd');
      const upcomingBookings = bookings
        .filter((b) => {
          const isFuture = pickDate(b.pickup_date) >= today;
          return (b.status === 'confirmed' || b.status === 'active') && isFuture;
        })
        .sort((a, b) => (pickDate(a.pickup_date) || '').localeCompare(pickDate(b.pickup_date) || ''))
        .slice(0, 5)
        .map((b) => ({
          id: b.id,
          vehicle: b.vehicle_name ?? 'Unknown',
          renter: b.renter_name ?? 'Unknown',
          date: b.pickup_date ?? '',
          days: daysBetween(b.pickup_date, b.return_date),
        }));

      const activeBookingsCount = bookings.filter(
        (b) => b.status === 'confirmed' || b.status === 'active',
      ).length;

      const heatmapData: { date: string; count: number }[] = [];
      const tripDates = new Map<string, number>();
      trips.forEach((t) => {
        const d = pickDate(t.start_date);
        if (d) tripDates.set(d, (tripDates.get(d) || 0) + 1);
      });
      for (let i = 140; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = format(d, 'yyyy-MM-dd');
        heatmapData.push({ date: key, count: tripDates.get(key) ?? 0 });
      }

      setData({
        ytdRevenue,
        mtdRevenue,
        ytdExpenses,
        mtdExpenses,
        ytdPayouts,
        mtdPayouts,
        ytdProfit,
        mtdProfit,
        totalVehicles: activeVehicles.length,
        activeBookings: activeBookingsCount,
        avgDailyRate,
        utilization,
        revenueChange,
        profitChange,
        monthlyData,
        expenseBreakdown,
        vehiclePerformance,
        upcomingBookings,
        heatmapData,
      });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refresh: fetchDashboard };
}
