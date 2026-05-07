# Overflow Rentals — Turo Fleet Management SaaS

## Stack
- **Expo SDK 54** + **Expo Router v6** (file-based routing)
- **TypeScript** throughout
- **Supabase** — Postgres DB, Row-Level Security, Auth (email/password)
- **Stripe** — planned for recurring billing
- **react-native-svg** + **d3-shape/d3-scale** — custom charts

## Project Structure
```
app/                  # Expo Router pages
  (auth)/             # Login, Register screens
  (app)/              # Authenticated app with sidebar (web) / bottom tabs (mobile)
    fleet/            # Vehicle management
    bookings/         # Reservation tracking
    trips/            # Trip/earnings tracking + CSV import
    renters/          # Guest directory
    cleaning/         # Cleaning schedule
    maintenance/      # Service records
    checklists/       # Pre/post-trip SOPs
    expenses/         # Expense tracking
    claims/           # Damage/violation claims
    payouts/          # Owner draws, salaries
    reports/          # P&L, vehicle analysis, tax forecast
    team/             # Team member management
    settings/         # Business config
src/
  components/ui/      # shadcn-inspired components (Button, Card, Input, Badge, Modal, Select)
  components/charts/  # AreaChart, DonutChart, BarChart, KpiCard, Heatmap
  components/shared/  # Sidebar, BottomNav, ScreenHeader
  hooks/              # useSupabaseCrud, useDashboard, useSettings
  lib/                # supabase client, theme, utils
  types/              # TypeScript types for all 12 DB tables
  providers/          # AuthProvider
supabase/migrations/  # SQL schema with RLS policies
```

## Key Patterns
- `useSupabaseCrud<T>(tableName)` — generic CRUD hook, auto-filters by user_id
- All tables have RLS policies scoping data to `auth.uid() = user_id`
- Responsive: sidebar on desktop (≥768px), bottom tabs on mobile
- Dark theme: background #1f1f1f, primary #593CFB
- Charts use react-native-svg + d3-shape for cross-platform rendering

## Commands
- `npm start` — start Expo dev server
- `npm run web` — start web
- `npm run ios` — start iOS
- `npm run android` — start Android
- `npm run typecheck` — TypeScript check

## Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase and Stripe keys.
