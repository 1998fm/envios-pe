# Tori (envios-pe)

Shipping and sales management for Peruvian online sellers. Each business gets:

- a **branded public form** (`/f/[slug]`) where customers enter their own shipping details;
- a **dashboard** for shipments (Motorizado, Shalom, Olva, Marvisur, Flores, store pickup…), sales, products and
  inventory (kardex), purchases, expenses, and reports;
- **plans** (Basic / Pro / Business Plus), with subscriptions paid through MercadoPago.

Built with **Next.js 16** (App Router), **React 19**, **Supabase** (auth, Postgres, storage, realtime),
**Tailwind CSS 4**, and **MercadoPago**.

For a full walkthrough of every screen and API, see [docs/GUIA_SISTEMA.md](docs/GUIA_SISTEMA.md) (Spanish).

---

## Requirements

- **Node.js >= 20.9** (LTS 22 or 24 recommended) and npm
- A **Supabase** project
- Optional: MercadoPago credentials, a Google Analytics ID

The full list is in [REQUIREMENTS.md](REQUIREMENTS.md).

> **Windows 11 users:** if `npm run dev` shows *"An Application Control policy has blocked this file"* or every page
> returns 500 with *"Cannot find native binding"*, Smart App Control is blocking Next.js/Tailwind native modules.
> See [docs/WINDOWS-BLOCKED-NATIVE-MODULES.md](docs/WINDOWS-BLOCKED-NATIVE-MODULES.md).

## Getting started

### 1. Install dependencies

```bash
git clone https://github.com/1998fm/envios-pe.git
cd envios-pe
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.sample .env.local          # PowerShell: Copy-Item .env.local.sample .env.local
```

Fill in at least the three Supabase values from **Supabase → Project Settings → API**:

```dotenv
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Every variable is documented in [`.env.local.sample`](.env.local.sample).

### 3. Set up the database

The schema lives in [`supabase/`](supabase) as SQL scripts. In a new Supabase project, run them in the
**SQL Editor**. Create the base tables first (`ventas.sql`, `clientes-table.sql`, `inventario.sql`, `compras.sql`,
`gastos.sql`, `plan-system.sql`, …), then the migrations, RPCs (`rpc-*.sql`), RLS (`rls-policies.sql`,
`roles-negocio.sql`) and realtime scripts (`realtime-*.sql`).

You also need a public Storage bucket named **`logos`**.

> The scripts aren't numbered. If one fails because a table or column is missing, run the script that creates it
> first. If you can, connect to an existing dev/staging Supabase project instead of building a new one.

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000. Register a business at `/register` to reach the dashboard and your public form.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with Turbopack on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build (run `build` first) |
| `npm run lint` | ESLint |
| `node scripts/test-inventario.mjs` | E2E inventory/kardex test against the Supabase project in `.env.local`. It creates and then deletes a throwaway business. **Don't point it at production.** |

## Project structure

```
app/                Next.js App Router
  api/              Route handlers (envios, ventas, payments, webhooks, olva/shalom sync, cron, admin…)
  dashboard/        Seller dashboard
  f/[slug]/         Public branded order form (+ Supabase client helpers in lib/)
  admin/            Super-admin panel
  login, register, onboarding, reset-password, invitacion/
src/
  components/       Shared UI components
  lib/              Business logic (plans, MercadoPago, auth helpers, Olva/Shalom sync…)
supabase/           SQL schema, migrations, RLS policies, RPCs
scripts/            Maintenance / test scripts
docs/               System guide and functional manual (Spanish)
```

## Deployment

The app deploys to **Vercel**. Set the same environment variables there, with `NEXT_PUBLIC_SITE_URL` set to the
production URL. `vercel.json` sets up these cron jobs:

| Route | Schedule (UTC) |
|---|---|
| `/api/shalom/sync` | Mondays 05:00 |
| `/api/olva/sync` | Mondays 06:00 |
| `/api/cron/downgrade-plans` | Daily 06:00 |

Cron routes only accept requests that carry Vercel's `x-vercel-cron` header. To trigger the courier syncs manually,
`POST` with the `x-sync-key` header set to `OLVA_SYNC_SECRET` / `SHALOM_SYNC_SECRET`.

For MercadoPago, point the webhook at `https://<your-domain>/api/webhooks/mercadopago`.
