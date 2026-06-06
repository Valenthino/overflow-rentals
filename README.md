# Overflow Fleet

The all-in-one platform for Turo hosts. A cross-platform SaaS that runs on **iOS, Android, and the web** from a single Expo + React Native codebase.

> The product is branded **Overflow Fleet** (OVF). The GitHub repository keeps its original `overflow-rentals` slug.

> Live web: **https://ovf.expo.app**

---

## What it does

A complete fleet-management workspace built for active Turo hosts:

| Section | Screens |
|---|---|
| **Overview** | Dashboard with 8 KPIs, animated revenue/profit area chart, expense donut, 20-week booking heatmap |
| **Operations** | Fleet, Bookings, Trips (with Turo CSV import), Renters, Cleaning, Maintenance, 34-step pre/post-trip Checklists |
| **Financial** | Expenses, Claims (8-stage workflow), Payouts, Reports (P&L, vehicle ROI, US/CA tax forecast with CPP) |
| **Admin** | Team management, Settings (theme, language, business config, tax setup) |

## Stack

- **Expo SDK 54** + **Expo Router v6** — file-based routing, web + iOS + Android from one codebase
- **TypeScript** throughout (strict mode, zero type errors)
- **Supabase** — Postgres + Row-Level Security + Auth (email/password)
- **react-native-svg + d3-shape/d3-scale** — fully cross-platform animated charts (smooth cardinal curves, gradient fills, animated counters — chart.js look without the browser-only constraint)
- **EAS Build** — iOS simulator builds, Android APKs, EAS Update OTA channel, EAS Hosting for web

## Features

- **Light / Dark / System theme** — persisted, follows OS in system mode
- **i18n** — English, Spanish, French. Auto-detects browser language; switchable in Settings. Currency and date formatters follow the locale.
- **Defensive boot** — env-var validation on launch; missing keys show a helpful screen instead of crashing the app
- **Root error boundary** — uncaught errors render an in-app diagnostic panel (with stack in dev) instead of a white screen
- **Real Turo CSV import** — handles the full 46-column export, sums multiple discount and fee tiers into the schema, strips owner names from vehicle nicknames
- **Responsive shell** — sidebar on ≥768px, bottom-tab nav on mobile

## Quick start

### Prerequisites

- Node.js 20+
- An [Expo account](https://expo.dev) (for EAS builds)
- A [Supabase project](https://supabase.com) (free tier is fine)

### Install

```bash
git clone https://github.com/Valenthino/overflow-rentals.git
cd overflow-rentals
npm install
```

### Configure

Copy `.env.example` to `.env` and fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx
```

The Supabase **publishable** (anon) key is safe to commit and ship in the client — RLS policies in the database protect every row by `auth.uid() = user_id`.

### Run

```bash
npm run web        # Browser at http://localhost:8081
npm start          # Then press 'i' for iOS sim, 'a' for Android emulator
npm run typecheck  # Verify TypeScript
```

## Project structure

```
app/                           Expo Router pages
├── _layout.tsx                Providers: ErrorBoundary > Theme > Locale > Auth
├── index.tsx                  Auth-routed redirect + config-missing screen
├── (auth)/                    Login, Register, Forgot Password
└── (app)/                     Authenticated app
    ├── _layout.tsx            Sidebar (desktop) / BottomNav (mobile)
    ├── index.tsx              Dashboard
    ├── fleet/, bookings/, trips/, renters/, cleaning/,
    │   maintenance/, checklists/, expenses/, claims/,
    │   payouts/, reports/, team/, settings/

src/
├── components/
│   ├── brand/logo.tsx         SVG Logo + LogoMark (light/dark aware)
│   ├── ui/                    Button, Card, Input, Modal, Select,
│   │                          Badge, Skeleton, EmptyState (theme-aware)
│   ├── charts/                AreaChart, BarChart, DonutChart,
│   │                          KpiCard, Heatmap (cross-platform SVG)
│   └── shared/                Sidebar, BottomNav, ScreenHeader, ErrorBoundary
├── hooks/
│   ├── useSupabaseCrud.ts     Generic CRUD hook (auto-filters by user_id)
│   └── useDashboard.ts        Dashboard aggregations (YoY, MTD, utilization)
├── lib/
│   ├── env.ts                 Env-var validation
│   ├── supabase.ts            Supabase client (defensive stub if unconfigured)
│   ├── theme.ts               Color tokens (dark + light), spacing, typography
│   ├── utils.ts               formatCurrency / formatPercent / formatDate
│   └── i18n/                  en / es / fr translations + translate()
├── providers/
│   ├── ThemeProvider.tsx      mode (light/dark/system) + persistence
│   ├── LocaleProvider.tsx     locale + persistence + formatter wiring
│   └── AuthProvider.tsx       Supabase auth, race-safe
├── constants/navigation.ts    NAV_ITEMS with i18n labelKey
└── types/database.ts          Generated Supabase types

supabase/migrations/           SQL schema with RLS policies
├── 001_initial_schema.sql     12 tables (vehicles, trips, bookings, etc.)
└── 002_lock_down_trigger_functions.sql

assets/                        App icon, splash, adaptive icon
app.json                       Expo config (incl. EAS Update + runtimeVersion)
eas.json                       Build profiles (development, preview, production)
```

## Theming

```tsx
import { useTheme, useTokens } from '@/providers/ThemeProvider';

function MyComponent() {
  const { tokens, mode, setMode } = useTheme();
  // tokens.background, tokens.primary, tokens.text, etc.
  // mode: 'light' | 'dark' | 'system'
}
```

Tokens are defined in [`src/lib/theme.ts`](src/lib/theme.ts). Add a new color by extending the `ColorTokens` interface and providing values in both `colorsDark` and `colorsLight`.

## Internationalization

```tsx
import { useT, useLocale } from '@/providers/LocaleProvider';

function MyComponent() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  return <Text>{t('dashboard.title')}</Text>;
}
```

Translations live in [`src/lib/i18n/locales/`](src/lib/i18n/locales/). All three dictionaries share the same shape (enforced via the `Translations` type derived from `en.ts`). Adding a key requires updating all three files.

## CSV import (Trips)

Paste your Turo "Trip earnings" CSV export directly into **Trips → Import CSV**. The parser:

- Strips owner-name + plate from `Vehicle` (`"WENDSONGDO PRISCA's Subaru (BC #SK365R)"` → `"Subaru"`), prefers the cleaner `Vehicle name` column when present
- Sums **10 discount columns** (3-day, 1-week, …, host promotional credit) into `total_discounts`
- Sums **15 fee columns** (cleaning, tolls, EV charging, gas reimbursement, …) into `other_fees`
- Maps Turo statuses (`Completed` → completed, `In-progress` → active, `Booked` → upcoming)
- Surfaces non-numeric cells as warnings instead of silently defaulting to zero

## EAS / deployment

> **Full guide:** [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) covers the Supabase
> auth URL/SMTP setup, web hosting on Hostinger or Cloudflare Pages, mobile builds
> on the Expo free tier, and the security checklist.

```bash
# Local dev build (faster than EAS for iteration)
npx expo run:ios
npx expo run:android

# Cloud builds via EAS
npx eas-cli login
npx eas-cli build --profile development --platform ios     # ~25 min
npx eas-cli build --profile development --platform android # ~20 min

# OTA update (delivers JS-only changes to existing dev/preview clients)
npx eas-cli update --branch production --message "your message"

# Web deploy to EAS Hosting
npx expo export -p web
npx eas-cli deploy --prod
```

Build profiles in [`eas.json`](eas.json):
- `development` — dev client, iOS simulator, internal distribution
- `preview` — internal distribution, channel `preview`
- `production` — channel `production`, auto-incrementing version

## Supabase schema

12 tables, all RLS-protected by `auth.uid() = user_id`:

`vehicles · trips · bookings · renters · expenses · cleaning · maintenance · claims · team_members · payouts · mileage_logs · settings`

The signup trigger creates a `settings` row for each new user automatically. See [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).

## Scripts

```bash
npm start          # Expo dev server (any platform)
npm run web        # Web dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## License

MIT (or update to your preferred license).

## Author

Built by [Valentin Sawadogo](https://github.com/Valenthino) — a Turo host in BC, Canada turning his own operations spreadsheet into a SaaS.
