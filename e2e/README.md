# Pruebas end-to-end (Playwright)

Validan la app completa **sin tocar la base real**: levantan una base local en
memoria y la app apuntando a ella. Sirven para comprobar, antes de desplegar, que
el registro, el panel, las ventas/stock, los permisos y las protecciones de
seguridad funcionan.

```bash
npm install                  # una sola vez (baja Playwright y Chromium: npx playwright install chromium)
npm run db:setup             # una sola vez: descarga PostgREST (binario) para el stack local

npm run test:e2e             # navegador VISIBLE, un test a la vez (por defecto)
npm run test:e2e:headless    # sin ventana, en paralelo (lo que usa CI)
npm run test:e2e:prod        # next build + next start: prueba lo que se despliega
npm run test:e2e:ui          # panel interactivo de Playwright
```

Variables: `E2E_HEADLESS=1` (sin ventana; es el valor por defecto cuando `CI=true`),
`E2E_SLOWMO=ms` (pausa entre acciones en modo visible, 150 por defecto; `0` = sin
pausa), `E2E_BASE_URL` (probar contra una app ya levantada), `APP_PORT`.

## Qué hay

| Archivo | Qué cubre |
|---|---|
| `auth.spec.ts` | Registro (perfil + prueba de 30 días), validaciones, límite por IP, login/logout, rutas privadas, recuperar contraseña |
| `core-flows.spec.ts` | Productos y stock, ventas (descuento, anulación, edición, abonos), compras, gastos, clientes, pedidos públicos, límites de plan |
| `dashboard.spec.ts` | Panel por UI: cada pestaña, cambiar estado/tamaño de pedidos, búsqueda, detalle y borrado, formulario público |
| `security.spec.ts` | Regresiones de seguridad (IDOR, roles en servidor, cron, webhook, tracking, configuración, sesión, subidas) |
| `no-leaks.spec.ts` | El navegador **no** ve la URL/llaves de la base, no le habla, y la sesión es httpOnly |
| `unit.spec.ts` | Utilidades de seguridad (URLs, rate limit, cron) |

## Cómo funciona el stack local (`scripts/local-db/`)

* **Postgres real y efímero** (`embedded-postgres`): vive en un directorio temporal
  con `fsync` apagado y se borra al terminar. Nada persiste.
* **PostgREST** (binario descargado por `npm run db:setup`) = la misma API de datos
  que Supabase.
* **Gateway** (`gateway.mjs`): emula `/auth/v1` (registro, login, tokens, PKCE,
  admin), `/storage/v1` (en memoria) y reenvía `/rest/v1` a PostgREST.
* El esquema sale de `supabase/*.sql` en el orden de `stack.mjs`
  (`SCHEMA_ORDER`) más `sql/01-base-tables.sql` (las tablas `profiles`, `envios` y
  `tarifas_moto` que en producción se crearon a mano).

`npm run dev:local` levanta el mismo stack y la app para trabajar a mano, con un
usuario demo (`demo@tori.local` / `Demo1234!`). `npm run db:local` solo la base.

## Importante

* Los tests **crean sus propios usuarios** con correos `@e2e.test` y IP falsa por
  contexto (`x-forwarded-for`), así no chocan con los límites de intentos.
* Al agregar una migración nueva en `supabase/`, añádela a `SCHEMA_ORDER`.
* Si un test de seguridad falla, **no desplegar**.
