# Physio PMS — Om Health Care

Frontend for a physiotherapy practice management system: patients, appointments,
consultations, treatments, billing, expenses, reports and settings.

Built with Next.js 16 (App Router), React 19, TypeScript, MUI 9, TanStack Query,
React Hook Form + Zod, Day.js and Recharts. The backend (NestJS + Prisma +
PostgreSQL) is not built yet; the app runs on a relational mock data layer
behind the same service interfaces the real API will implement.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build
```

Copy `.env.example` to `.env.local` to change the API mode.

## Architecture

```
app/(app)/<module>/…        Thin route files (metadata + params) → feature views
features/<module>/          Module UI: list/detail/form views, Zod schemas, columns, actions
components/common/          Shared UI: PageHeader, DataTable, FilterBar, StatCard, StatusChip,
                            DetailHero, DetailLayout, QuickActions, ConfirmDialog, states…
components/forms/           RHF-bound fields: FormTextField, PatientSelectField, FormSection…
components/charts/          TrendChart (Recharts), BreakdownBars, SegmentBar
components/layout/          AppShell, Sidebar, Header, GlobalSearch, menus
hooks/                      TanStack Query hooks per entity (+ cache invalidation)
services/                   One service per entity: a mock and an HTTP implementation
lib/api/                    Axios client, API mode, error normalisation, mock database
mock/                       Seed generators (single relational dataset)
types/                      Domain types shared by UI, services and mocks
theme/                      MUI theme, colour tokens, status tones
```

Data flow: **page → feature view → hook → service → (mock DB | Axios → NestJS)**.
Pages never import services or mock data directly.

### Mock data

`mock/index.ts#createSeedData` builds one consistent dataset: 190 patients,
~2,200 appointments, consultations, ~1,900 treatment sessions, ~740 invoices with
payments, and 12 months of expenses. Records are generated as episodes of care
(consultation → treatment sessions → invoices → payments → review), so every ID
(`PT-0001`, `APT-…`, `CON-…`, `TRT-…`, `INV-…`, `PAY-…`, `EXP-…`) resolves to the
same record everywhere, including the dashboard and reports. Dates are relative to
today.

The mock database lives in memory and is persisted to `localStorage`. Untouched
demo data regenerates daily; once you change something, it is kept until you use
**Settings → Clinic Profile → Reset demo data**.

### Connecting the backend

1. Implement the endpoints used by the `http*Service` objects in `services/`
   (e.g. `GET /patients`, `PUT /appointments/:id`, `POST /invoices/:id/payments`,
   `GET /dashboard/summary`, `GET /reports/summary?from&to`).
   List endpoints return records with embedded `patient` / `therapist` references,
   matching the `…WithRelations` types (Prisma `include`).
2. Set `NEXT_PUBLIC_API_MODE=live` and `NEXT_PUBLIC_API_URL`.
3. Replace the mock session in `providers/AuthProvider.tsx` with a call to your auth
   endpoint; the Axios client already sends a bearer token from `localStorage`.
   Role permissions live in `lib/auth/permissions.ts`.

Business rules currently enforced by the mock layer (and expected from the API):
therapist double-booking prevention, one active invoice per treatment session,
payments cannot exceed the balance, invoices with payments cannot be cancelled or
deleted, and patients with clinical history cannot be deleted (mark inactive instead).
# physiocare-pms
