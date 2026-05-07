import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { format, startOfMonth, startOfYear, subMonths, eachMonthOfInterval } from 'date-fns';

interface DashboardData {
  ytdRevenue: number;
  mtdRevenue: number;
  ytdExpenses: number;
  mtdExpenses: number;
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

export function useDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const now = new Date();
    const yearStart = format(startOfYear(now), 'yyyy-MM-dd');
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const lastYearStart = format(startOfYear(subMonths(now, 12)), 'yyyy-MM-dd');

    const [tripsRes, expensesRes, vehiclesRes, bookingsRes, payoutsRes] = await Promise.all([
      supabase.from('trips').select('*').eq('user_id', user.id).gte('start_date', lastYearStart),
      supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', yearStart),
      supabase.from('vehicles').select('*').eq('user_id', user.id),
      supabase.from('bookings').select('*').eq('user_id', user.id).in('status', ['confirmed', 'active']),
      supabase.from('payouts').select('amount').eq('user_id', user.id).gte('date', yearStart),
    ]);

    const trips = tripsRes.data ?? [];
    const expenses = expensesRes.data ?? [];
    const vehicles = vehiclesRes.data ?? [];
    const bookings = bookingsRes.data ?? [];

    const ytdTrips = trips.filter((t: any) => t.start_date >= yearStart);
    const mtdTrips = trips.filter((t: any) => t.start_date >= monthStart);

    const ytdRevenue = ytdTrips.reduce((s: number, t: any) => s + (t.total_earnings || 0), 0);
    const mtdRevenue = mtdTrips.reduce((s: number, t: any) => s + (t.total_earnings || 0), 0);
    const ytdExpenses = expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
    const mtdExpenses = expenses
      .filter((e: any) => e.date >= monthStart)
      .reduce((s: number, e: any) => s + (e.amount || 0), 0);

    const prevYearTrips = trips.filter((t: any) => t.start_date < yearStart);
    const prevYearRevenue = prevYearTrips.reduce((s: number, t: any) => s + (t.total_earnings || 0), 0);
    const revenueChange = prevYearRevenue > 0 ? ((ytdRevenue - prevYearRevenue) / prevYearRevenue) * 100 : 0;

    const ytdProfit = ytdRevenue - ytdExpenses;
    const mtdProfit = mtdRevenue - mtdExpenses;
    const profitChange = revenueChange;

    const activeVehicles = vehicles.filter((v: any) => v.status !== 'retired');
    const avgDailyRate = activeVehicles.length > 0
      ? activeVehicles.reduce((s: number, v: any) => s + (v.daily_rate || 0), 0) / activeVehicles.length
      : 0;

    const totalTripDays = ytdTrips.reduce((s: number, t: any) => s + (t.days || 0), 0);
    const maxDays = activeVehicles.length * 365;
    const utilization = maxDays > 0 ? (totalTripDays / maxDays) * 100 : 0;

    const months = eachMonthOfInterval({ start: startOfYear(now), end: now });
    const monthlyData = months.map((m) => {
      const key = format(m, 'yyyy-MM');
      const label = format(m, 'MMM');
      const rev = ytdTrips
        .filter((t: any) => t.start_date?.startsWith(key))
        .reduce((s: number, t: any) => s + (t.total_earnings || 0), 0);
      const exp = expenses
        .filter((e: any) => e.date?.startsWith(key))
        .reduce((s: number, e: any) => s + (e.amount || 0), 0);
      return { label, value: rev, secondaryValue: rev - exp };
    });

    const expenseMap = new Map<string, number>();
    expenses.forEach((e: any) => {
      expenseMap.set(e.category, (expenseMap.get(e.category) || 0) + e.amount);
    });
    const expenseBreakdown = Array.from(expenseMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, val]) => ({
        label: cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: val,
        color: EXPENSE_COLORS[cat] || '#71717A',
      }));

    const vehicleMap = new Map<string, { revenue: number; trips: number; expenses: number }>();
    vehicles.forEach((v: any) => {
      vehicleMap.set(v.id, { revenue: 0, trips: 0, expenses: 0 });
    });
    ytdTrips.forEach((t: any) => {
      if (t.vehicle_id && vehicleMap.has(t.vehicle_id)) {
        const entry = vehicleMap.get(t.vehicle_id)!;
        entry.revenue += t.total_earnings || 0;
        entry.trips += 1;
      }
    });
    expenses.forEach((e: any) => {
      if (e.vehicle_id && vehicleMap.has(e.vehicle_id)) {
        vehicleMap.get(e.vehicle_id)!.expenses += e.amount || 0;
      }
    });
    const vehiclePerformance = vehicles
      .map((v: any) => {
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

    const upcomingBookings = bookings
      .filter((b: any) => b.status === 'confirmed')
      .sort((a: any, b: any) => (a.pickup_date ?? '').localeCompare(b.pickup_date ?? ''))
      .slice(0, 5)
      .map((b: any) => ({
        id: b.id,
        vehicle: b.vehicle_name ?? 'Unknown',
        renter: b.renter_name ?? 'Unknown',
        date: b.pickup_date ?? '',
        days: b.return_date && b.pickup_date
          ? Math.ceil((new Date(b.return_date).getTime() - new Date(b.pickup_date).getTime()) / 86400000)
          : 0,
      }));

    const heatmapData: { date: string; count: number }[] = [];
    const tripDates = new Map<string, number>();
    trips.forEach((t: any) => {
      if (t.start_date) {
        const d = t.start_date.split('T')[0];
        tripDates.set(d, (tripDates.get(d) || 0) + 1);
      }
    });
    for (let i = 140; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      heatmapData.push({ date: key, count: tripDates.get(key) ?? 0 });
    }

    setData({
      ytdRevenue,
      mtdRevenue,
      ytdExpenses,
      mtdExpenses,
      ytdProfit,
      mtdProfit,
      totalVehicles: activeVehicles.length,
      activeBookings: bookings.length,
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
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, refresh: fetchDashboard };
}
