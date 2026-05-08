import { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { Maintenance, Vehicle } from '@/types/database';

export interface MaintenanceReminder {
  id: string;
  vehicle_id: string | null;
  vehicle_name: string;
  type: Maintenance['type'];
  due_date: string | null;
  due_odometer: number | null;
  current_odometer: number | null;
  days_until_due: number | null;
  km_until_due: number | null;
  severity: 'overdue' | 'soon' | 'upcoming';
}

const SOON_DAYS = 14;
const SOON_KM = 1000;

export function useMaintenanceReminders() {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [mRes, vRes] = await Promise.all([
          supabase.from('maintenance').select('*').eq('user_id', user.id),
          supabase.from('vehicles').select('*').eq('user_id', user.id),
        ]);
        if (cancelled) return;
        setMaintenance((mRes.data as Maintenance[]) ?? []);
        setVehicles((vRes.data as Vehicle[]) ?? []);
      } catch (e) {
        if (__DEV__) console.warn('[reminders] fetch failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const reminders = useMemo<MaintenanceReminder[]>(() => {
    if (loading) return [];

    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group maintenance records by (vehicle_id, type) and keep the most recent.
    const latestByKey = new Map<string, Maintenance>();
    for (const m of maintenance) {
      const key = `${m.vehicle_id ?? 'unknown'}::${m.type}`;
      const prev = latestByKey.get(key);
      if (!prev || (m.date && m.date > prev.date)) latestByKey.set(key, m);
    }

    const out: MaintenanceReminder[] = [];
    for (const m of latestByKey.values()) {
      if (!m.next_due_date && !m.next_due_odometer) continue;

      const vehicle = m.vehicle_id ? vehicleById.get(m.vehicle_id) : undefined;
      const currentOdo = vehicle?.current_odometer ?? null;

      let daysUntil: number | null = null;
      if (m.next_due_date) {
        const due = new Date(m.next_due_date);
        due.setHours(0, 0, 0, 0);
        daysUntil = Math.round((due.getTime() - today.getTime()) / 86_400_000);
      }

      let kmUntil: number | null = null;
      if (m.next_due_odometer != null && currentOdo != null) {
        kmUntil = m.next_due_odometer - currentOdo;
      }

      const overdueByDate = daysUntil != null && daysUntil < 0;
      const overdueByKm = kmUntil != null && kmUntil < 0;
      const soonByDate = daysUntil != null && daysUntil >= 0 && daysUntil <= SOON_DAYS;
      const soonByKm = kmUntil != null && kmUntil >= 0 && kmUntil <= SOON_KM;

      if (!overdueByDate && !overdueByKm && !soonByDate && !soonByKm) continue;

      out.push({
        id: m.id,
        vehicle_id: m.vehicle_id,
        vehicle_name: m.vehicle_name ?? (vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown vehicle'),
        type: m.type,
        due_date: m.next_due_date,
        due_odometer: m.next_due_odometer,
        current_odometer: currentOdo,
        days_until_due: daysUntil,
        km_until_due: kmUntil,
        severity: overdueByDate || overdueByKm ? 'overdue' : soonByDate || soonByKm ? 'soon' : 'upcoming',
      });
    }

    out.sort((a, b) => {
      const order = { overdue: 0, soon: 1, upcoming: 2 } as const;
      if (a.severity !== b.severity) return order[a.severity] - order[b.severity];
      const ad = a.days_until_due ?? 9999;
      const bd = b.days_until_due ?? 9999;
      return ad - bd;
    });

    return out;
  }, [maintenance, vehicles, loading]);

  return { reminders, loading };
}
