# Requirements

What you need to run Tori (`envios-pe`) locally. Setup steps are in the [README](README.md).

## Software

| Tool | Version | Notes |
|---|---|---|
| Node.js | **>= 20.9.0** (LTS 22 or 24 recommended) | Minimum required by Next.js 16. Check with `node -v`. |
| npm | >= 10 | Comes with Node. The repo ships a `package-lock.json`, so use npm, not yarn/pnpm/bun. |
| Git | any recent | |
| OS | Windows 10/11, macOS, Linux | **Windows:** Smart App Control or App Control for Business must allow native `.node` modules. See [docs/WINDOWS-BLOCKED-NATIVE-MODULES.md](docs/WINDOWS-BLOCKED-NATIVE-MODULES.md). |

### Native modules

Next.js (SWC / Turbopack) and Tailwind CSS v4 (Oxide) load native binaries from `node_modules`.
npm installs the right one for your platform automatically:

- `@next/swc-<platform>` → `next-swc.<platform>.node`
- `@tailwindcss/oxide-<platform>` → `tailwindcss-oxide.<platform>.node`

If either one can't load, the dev server starts but every page returns **500**.

## Accounts and services

| Service | Required? | Used for |
|---|---|---|
| [Supabase](https://supabase.com) project | **Yes** | Auth, Postgres database, Storage (`logos` bucket), Realtime |
| [MercadoPago](https://www.mercadopago.com.pe/developers) (Peru) | Optional | Pro plan subscriptions and payments |
| Google Analytics 4 | Optional | `NEXT_PUBLIC_GA_ID` |
| [Vercel](https://vercel.com) | Production only | Hosting and the cron jobs in `vercel.json` |

## Environment variables

Every variable is listed and explained in [`.env.local.sample`](.env.local.sample).

| Variable | Required | Scope |
|---|---|---|
| `SUPABASE_URL` | Yes | Server only |
| `SUPABASE_ANON_KEY` | Yes | Server only |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Browser + server |
| `MP_ACCESS_TOKEN` | For payments | Server only |
| `MP_WEBHOOK_SECRET` | For payments | Server only |
| `OLVA_SYNC_SECRET` | For manual Olva sync | Server only |
| `SHALOM_SYNC_SECRET` | For manual Shalom sync | Server only |
| `NEXT_PUBLIC_GA_ID` | No | Browser |

## npm dependencies

Declared in [`package.json`](package.json) and pinned in `package-lock.json`. `npm install` installs all of them.
The main ones:

- **Framework:** `next` 16, `react` / `react-dom` 19
- **Data / auth:** `@supabase/supabase-js`, `@supabase/ssr`
- **Payments:** `mercadopago`
- **UI:** `tailwindcss` 4 (+ `@tailwindcss/postcss`), `framer-motion`, `lucide-react`, `sonner`, `recharts`, `canvas-confetti`
- **Utilities:** `xlsx` (Excel export), `qrcode.react`, `html5-qrcode` (QR scanning)
- **Dev:** `typescript` 5, `eslint` 9 + `eslint-config-next`
