// Supabase Edge Function: maintenance-reminders-cron
//
// Scheduled function (intended for daily cron) that scans every user's
// maintenance records, computes overdue and upcoming items, and emails the
// owner a digest via the `send-email` function.
//
// Schedule with the Supabase dashboard or `supabase functions deploy --schedule`:
//   supabase functions deploy maintenance-reminders-cron \
//     --no-verify-jwt --schedule "0 14 * * *"
// (14:00 UTC = 7am Pacific).
//
// Required env vars (set with `supabase secrets set`):
//   SUPABASE_URL                  auto-set in production
//   SUPABASE_SERVICE_ROLE_KEY     auto-set in production — required for cross-user reads
//   SEND_EMAIL_FUNCTION_URL       optional override, defaults to derived URL
//
// Notes:
// - Uses the service role key so it can read every user's data; this function
//   should NEVER be exposed publicly. Keep `--no-verify-jwt` set when deploying
//   so the cron runner can call it without a user JWT.

// @ts-ignore — Deno std imports
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-ignore — Supabase Deno SDK
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

// @ts-ignore — Deno globals
declare const Deno: { env: { get(name: string): string | undefined } };

const SOON_DAYS = 14;
const SOON_KM = 1000;

interface Maintenance {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  vehicle_name: string | null;
  type: string;
  date: string;
  next_due_date: string | null;
  next_due_odometer: number | null;
}

interface Vehicle {
  id: string;
  current_odometer: number | null;
  make: string;
  model: string;
  year: number;
}

interface ReminderItem {
  vehicle_name: string;
  type: string;
  due_date: string | null;
  due_odometer: number | null;
  days_until_due: number | null;
  km_until_due: number | null;
  severity: 'overdue' | 'soon' | 'upcoming';
}

function computeReminders(
  maintenance: Maintenance[],
  vehiclesByUser: Map<string, Vehicle[]>,
): Map<string, ReminderItem[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const byUser = new Map<string, ReminderItem[]>();
  const latestByKey = new Map<string, Maintenance>();

  for (const m of maintenance) {
    const key = `${m.user_id}::${m.vehicle_id ?? 'unknown'}::${m.type}`;
    const prev = latestByKey.get(key);
    if (!prev || (m.date && m.date > prev.date)) latestByKey.set(key, m);
  }

  for (const m of latestByKey.values()) {
    if (!m.next_due_date && !m.next_due_odometer) continue;

    const userVehicles = vehiclesByUser.get(m.user_id) ?? [];
    const vehicle = m.vehicle_id ? userVehicles.find((v) => v.id === m.vehicle_id) : undefined;
    const currentOdo = vehicle?.current_odometer ?? null;

    let daysUntil: number | null = null;
    if (m.next_due_date) {
      const due = new Date(m.next_due_date);
      due.setUTCHours(0, 0, 0, 0);
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

    const item: ReminderItem = {
      vehicle_name:
        m.vehicle_name ??
        (vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown vehicle'),
      type: m.type,
      due_date: m.next_due_date,
      due_odometer: m.next_due_odometer,
      days_until_due: daysUntil,
      km_until_due: kmUntil,
      severity: overdueByDate || overdueByKm ? 'overdue' : 'soon',
    };

    const list = byUser.get(m.user_id) ?? [];
    list.push(item);
    byUser.set(m.user_id, list);
  }
  return byUser;
}

serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing service env vars' }), { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [{ data: maintenance, error: mErr }, { data: vehicles, error: vErr }] = await Promise.all([
    admin.from('maintenance').select('id, user_id, vehicle_id, vehicle_name, type, date, next_due_date, next_due_odometer'),
    admin.from('vehicles').select('id, user_id, current_odometer, make, model, year'),
  ]);

  if (mErr || vErr) {
    return new Response(JSON.stringify({ error: mErr?.message ?? vErr?.message }), { status: 500 });
  }

  const vehiclesByUser = new Map<string, Vehicle[]>();
  for (const v of (vehicles ?? []) as (Vehicle & { user_id: string })[]) {
    const list = vehiclesByUser.get(v.user_id) ?? [];
    list.push(v);
    vehiclesByUser.set(v.user_id, list);
  }

  const userReminders = computeReminders((maintenance as Maintenance[]) ?? [], vehiclesByUser);

  // Look up email addresses by hitting the auth.admin.listUsers endpoint.
  const { data: usersResult, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (usersErr) {
    return new Response(JSON.stringify({ error: usersErr.message }), { status: 500 });
  }

  const userById = new Map<string, { email: string; name?: string }>();
  for (const u of usersResult.users) {
    if (u.email) {
      userById.set(u.id, {
        email: u.email,
        name: (u.user_metadata as Record<string, unknown> | null)?.full_name as string | undefined,
      });
    }
  }

  const sendEmailUrl =
    Deno.env.get('SEND_EMAIL_FUNCTION_URL') ?? `${supabaseUrl}/functions/v1/send-email`;

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [userId, items] of userReminders) {
    const user = userById.get(userId);
    if (!user) {
      skipped++;
      continue;
    }
    const resp = await fetch(sendEmailUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.email,
        template: 'maintenance_reminder',
        data: { name: user.name, items },
      }),
    });
    if (!resp.ok) {
      errors.push(`${user.email}: HTTP ${resp.status}`);
    } else {
      sent++;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, sent, skipped, totalUsersWithReminders: userReminders.size, errors }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
