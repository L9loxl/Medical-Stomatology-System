# AMS — Advanced Medical Stomatology System

Next-generation dental clinic management platform with smart dashboard, patient management, appointments, financial tracking, medical imaging, dental charts, and AI recommendations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4, wouter routing, framer-motion, recharts
- API: Express 5 (runs at `/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Auth: Bearer token in `localStorage` via `setAuthTokenGetter`

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/api-client-react/src/generated/` — generated hooks and Zod schemas (DO NOT EDIT)
- `artifacts/ams/src/index.css` — CSS theme (HSL vars, dark/light mode)
- `artifacts/ams/src/App.tsx` — router setup + all providers
- `artifacts/ams/src/components/Layout.tsx` — sidebar + top bar
- `artifacts/ams/src/pages/` — all page components
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/db/schema/` — Drizzle DB schema files

## Architecture decisions

- Contract-first: OpenAPI spec → Orval codegen → typed hooks used everywhere in the frontend
- Token auth via `localStorage` Bearer token; `setAuthTokenGetter` wired in `main.tsx`
- Dental chart uses FDI notation (11–18, 21–28, 31–38, 41–48)
- AI recommendations are generated server-side based on patient medical flags (diabetes, hypertension, smoking, allergies)
- All monetary values stored as `numeric` in DB, parsed with `parseFloat()` in route responses

## Product

- **Dashboard** — live stats (patients, appointments, revenue, emergencies), revenue chart, today's schedule
- **Patients** — searchable/filterable list, full medical profile, AI clinical recommendations panel
- **Appointments** — week-view calendar grid + list view, status management
- **Financial** — payment tracking, revenue summary, overdue alerts, installment support
- **Medical Imaging** — grouped gallery by type (panoramic, periapical, CBCT...) with lightbox
- **Dental Chart** — interactive FDI 2D tooth chart with condition tracking
- **Reports** — recharts analytics (revenue bar, pie charts, trend area)
- **Settings** — profile, clinic info, appearance (dark/light), notifications, security

## Demo credentials

- **Email**: `ahmed@amsclinic.com` / **Password**: `demo123`
- Other accounts: `sara@amsclinic.com`, `rania@amsclinic.com`, `omar@amsclinic.com`

## Gotchas

- `pnpm --filter @workspace/api-spec run codegen` must be re-run after any OpenAPI spec change
- When adding a new route, register it in `artifacts/api-server/src/routes/index.ts`
- `/payments/summary` route MUST be defined BEFORE `/payments/:id` to avoid Express route conflict
- DB push: `pnpm --filter @workspace/db run push` — only for dev; never auto-runs in production

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
