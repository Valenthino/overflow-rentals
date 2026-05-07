-- Overflow Rentals: Initial Schema
-- 12 tables with RLS policies for multi-tenant SaaS

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- VEHICLES
-- ============================================================
create table public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  make text not null,
  model text not null,
  year integer not null,
  vin text,
  license_plate text,
  color text,
  status text not null default 'available' check (status in ('available', 'rented', 'maintenance', 'retired')),
  purchase_price numeric(12,2),
  purchase_date date,
  insurance_monthly numeric(10,2),
  financing_monthly numeric(10,2),
  turo_listing_url text,
  daily_rate numeric(10,2),
  retirement_date date,
  retirement_km integer,
  current_odometer integer,
  notes text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vehicles enable row level security;
create policy "Users manage own vehicles" on public.vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- TRIPS
-- ============================================================
create table public.trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reservation_id text,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  vehicle_name text,
  guest_name text,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  pickup_location text,
  return_location text,
  checkin_odometer integer,
  checkout_odometer integer,
  trip_price numeric(10,2) not null default 0,
  total_discounts numeric(10,2) not null default 0,
  extras numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  other_fees numeric(10,2) not null default 0,
  sales_tax numeric(10,2) not null default 0,
  host_fee numeric(10,2) not null default 0,
  total_earnings numeric(10,2) not null default 0,
  days integer not null default 0,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trips enable row level security;
create policy "Users manage own trips" on public.trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_trips_user_date on public.trips(user_id, start_date);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  vehicle_name text,
  renter_name text,
  renter_id uuid references public.renters(id) on delete set null,
  status text not null default 'confirmed' check (status in ('confirmed', 'active', 'completed', 'cancelled', 'no_show')),
  pickup_date date,
  pickup_time text,
  pickup_location text,
  return_date date,
  return_time text,
  return_location text,
  daily_rate numeric(10,2),
  total_price numeric(10,2),
  pre_trip_check boolean not null default false,
  post_trip_check boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RENTERS
-- ============================================================
create table public.renters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  turo_username text,
  drivers_license text,
  total_trips integer not null default 0,
  average_rating numeric(3,2),
  is_flagged boolean not null default false,
  flag_reason text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.renters enable row level security;
create policy "Users manage own renters" on public.renters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Now add RLS and FK for bookings (renters table needed first)
alter table public.bookings enable row level security;
create policy "Users manage own bookings" on public.bookings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_bookings_user_date on public.bookings(user_id, pickup_date);

-- ============================================================
-- EXPENSES
-- ============================================================
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  category text not null check (category in (
    'fuel', 'insurance', 'maintenance', 'cleaning', 'tolls_tickets',
    'parking', 'registration', 'financing', 'supplies', 'software',
    'marketing', 'office', 'professional', 'depreciation', 'other'
  )),
  description text not null,
  amount numeric(10,2) not null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  vehicle_name text,
  vendor text,
  payment_method text,
  is_tax_deductible boolean not null default true,
  gst_amount numeric(10,2) not null default 0,
  receipt_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;
create policy "Users manage own expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_expenses_user_date on public.expenses(user_id, date);

-- ============================================================
-- CLEANING
-- ============================================================
create table public.cleaning (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  vehicle_name text,
  date date not null,
  assigned_to text,
  type text not null default 'full' check (type in ('quick', 'full', 'deep')),
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed')),
  cost numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cleaning enable row level security;
create policy "Users manage own cleaning" on public.cleaning
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- MAINTENANCE
-- ============================================================
create table public.maintenance (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  vehicle_name text,
  date date not null,
  type text not null check (type in (
    'oil_change', 'tire_rotation', 'brake_service', 'battery',
    'transmission', 'coolant', 'air_filter', 'cabin_filter',
    'spark_plugs', 'alignment', 'inspection', 'recall', 'other'
  )),
  description text,
  vendor text,
  cost numeric(10,2) not null default 0,
  odometer integer,
  next_due_date date,
  next_due_odometer integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.maintenance enable row level security;
create policy "Users manage own maintenance" on public.maintenance
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- CLAIMS
-- ============================================================
create table public.claims (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  vehicle_name text,
  trip_id uuid references public.trips(id) on delete set null,
  renter_name text,
  category text not null check (category in (
    'body_damage', 'interior_damage', 'windshield', 'tire_wheel',
    'mechanical', 'theft', 'total_loss', 'smoking',
    'pet_damage', 'excessive_miles', 'late_return', 'toll_violation',
    'parking_ticket', 'other'
  )),
  status text not null default 'open' check (status in (
    'open', 'submitted', 'under_review', 'approved', 'denied', 'paid', 'appealed', 'closed'
  )),
  incident_date date,
  description text,
  claimed_amount numeric(10,2) not null default 0,
  received_amount numeric(10,2) not null default 0,
  insurance_claim_number text,
  is_insurance_claim boolean not null default false,
  resolution_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.claims enable row level security;
create policy "Users manage own claims" on public.claims
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
create table public.team_members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role text not null default 'driver' check (role in ('driver', 'cleaner', 'manager', 'admin')),
  pay_rate numeric(10,2),
  pay_type text not null default 'hourly' check (pay_type in ('hourly', 'per_job', 'salary')),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_members enable row level security;
create policy "Users manage own team" on public.team_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- PAYOUTS
-- ============================================================
create table public.payouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  recipient text not null,
  type text not null default 'owner_draw' check (type in ('owner_draw', 'salary', 'bonus', 'reimbursement', 'other')),
  amount numeric(10,2) not null,
  description text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payouts enable row level security;
create policy "Users manage own payouts" on public.payouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- MILEAGE LOGS
-- ============================================================
create table public.mileage_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  date date not null,
  odometer integer not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.mileage_logs enable row level security;
create policy "Users manage own mileage" on public.mileage_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- SETTINGS (key-value)
-- ============================================================
create table public.settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value text not null default '',
  primary key (user_id, key)
);

alter table public.settings enable row level security;
create policy "Users manage own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to all tables with updated_at
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'vehicles', 'trips', 'bookings', 'renters', 'expenses',
      'cleaning', 'maintenance', 'claims', 'team_members', 'payouts'
    ])
  loop
    execute format('
      create trigger set_updated_at
      before update on public.%I
      for each row execute function public.handle_updated_at();
    ', tbl);
  end loop;
end;
$$;

-- ============================================================
-- DEFAULT SETTINGS ON USER SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.settings (user_id, key, value) values
    (new.id, 'business_name', 'My Turo Business'),
    (new.id, 'business_location', ''),
    (new.id, 'tax_number', ''),
    (new.id, 'gst_rate', '5'),
    (new.id, 'pst_rate', '7'),
    (new.id, 'host_fee_percent', '25'),
    (new.id, 'fiscal_year_start', '01'),
    (new.id, 'currency', 'USD'),
    (new.id, 'country', 'US'),
    (new.id, 'province_state', ''),
    (new.id, 'gst_registered', 'false'),
    (new.id, 'timezone', 'America/Los_Angeles');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
