# CLAUDE.md — Tori (envios-pe)

Guía rápida para quien abre el proyecto por primera vez. Detalle por pantalla/API: `docs/GUIA_SISTEMA.md` (ojo: parte está desactualizada, ver "Desfases conocidos"). El código y los textos de UI están **en español**; mantén ese idioma en mensajes de usuario, comentarios y nombres de dominio.

## Qué es

SaaS para vendedores online peruanos. Cada negocio tiene:
- **Formulario público** con su marca (`/f/[slug]`) donde el cliente ingresa sus datos de envío.
- **Dashboard** (`/dashboard`): envíos (Motorizado, Shalom, Olva, Marvisur, Flores, recojo en tienda, método propio), ventas, productos + kardex, compras, gastos, clientes, resumen.
- **Planes** `basic | business_plus` (Básico y Plus), suscripción por MercadoPago. Registro = prueba Plus de 14 días. `pro` solo se interpreta como legado compatible con Plus.
- **Panel super-admin** (`/admin`) para operar empresas, planes, facturación, impersonación.
- Landing en `/` (`LandingPage` + `src/components/landing/*`).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4 · Supabase (Postgres/Auth/Storage) · MercadoPago · framer-motion · recharts · sonner · lucide-react · `xlsx` · Playwright (e2e). Node >= 20.9, **npm** (hay package-lock). Alias `@/*` → `src/*`; además se importa `app/f/[slug]/lib/supabase/admin` (como `'app/f/...'`, resuelve por baseUrl).

## Comandos

```bash
npm run dev               # next dev contra el Supabase de .env.local (¡base real si apunta a prod!)
npm run dev:local         # stack local efímero (Postgres embebido + PostgREST + gateway) + app. Demo: demo@tori.local / Demo1234!  (form: /f/demo-tori)
npm run db:setup          # una vez: descarga el binario de PostgREST
npm run db:local          # solo la base local
npm run test:e2e          # Playwright con navegador visible, 1 test a la vez
npm run test:e2e:headless # sin ventana, paralelo (CI)
npm run test:e2e:prod     # next build + start, prueba lo que se despliega
npm run db:instalacion    # regenera supabase/instalacion-completa.sql y lo prueba en base vacía
npm run lint
```
`scripts/test-inventario.mjs` crea/borra un negocio de prueba contra el Supabase de `.env.local`: **no apuntarlo a producción**.

## Arquitectura — reglas que NO hay que romper

1. **Solo servidor.** El navegador NO tiene cliente Supabase ni conoce URL/llaves. Todo pasa por `/api/*`. Variables `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` sin prefijo `NEXT_PUBLIC_` (las `NEXT_PUBLIC_SUPABASE_*` solo son fallback legado). `e2e/no-leaks.spec.ts` verifica que nada se filtre al bundle. Componentes `'use client'` usan `src/lib/clienteApi.ts` (`api()`, `obtenerSesion()`).
2. **Las rutas usan `service_role` (saltan RLS)** → el control de acceso vive en el código:
   - `requireNegocio(...permisos)` (`src/lib/negocioAuth.ts`): saca el dueño de los datos de la **sesión** (nunca de `?user_id=`/body), aplica permisos de rol y devuelve `ownerId`. Toda consulta filtra por `ownerId`/`profile_id`.
   - `src/lib/ownerAuth.ts` (`getSessionUser`, sesión por cookie httpOnly o `Authorization: Bearer`), `src/lib/adminAuth.ts` (super admin), `src/lib/cronAuth.ts` (cron: `Authorization: Bearer $CRON_SECRET`, falla cerrado; `x-vercel-cron` NO sirve).
   - SQL `supabase/acceso-solo-servidor.sql` quita a `anon`/`authenticated` todo permiso en `public`.
3. **Clientes Supabase**: admin (`app/f/[slug]/lib/supabase/admin.ts`, service role) para casi todo; `clienteAuth` (`src/lib/authServidor.ts`, anon + cookies) solo para `/api/auth/*` y `/auth/*`. Env en `src/lib/supabaseEnv.ts`.
4. **`proxy.ts`** (raíz; Next 16 renombró `middleware.ts` → `proxy.ts`, exporta `proxy`): solo barrera de UX (redirige `/dashboard`, `/admin`, `/onboarding` sin sesión; `/login`/`/register` con sesión). La autorización real está en cada API route.
5. **Imágenes**: `/media/{logos|productos}/...` se reescribe en `next.config.ts` hacia Storage; el navegador nunca ve la URL real.
6. **Tiempo real reemplazado por polling** (`src/hooks/usePolling.ts`); los `realtime-*.sql` son legado.
7. **Errores en español**: traducir errores de DB/Auth con `src/lib/erroresEs.ts` (`mensajeDb`, etc.); el detalle original solo al log del servidor. Errores de SQL propios: `RAISE EXCEPTION` (código P0001) ya en español.
8. **Rate limit** en memoria por IP (`src/lib/rateLimit.ts`, `permitir()`); es barrera casual en serverless, no global.
9. Validación de entradas del cliente: `idsValidos` (UUID) en `src/lib/enviosServidor.ts`, `urlSegura.ts`, `listaValida.ts`, `mediaUrl.ts`.

## Roles, planes, límites

- **Dueño** = `profiles.id`. Miembros con rol vía `business_members` (solo `business_plus`, hasta 4). `src/lib/roles.ts` define `PermisosRol` (`ver_resumen/envios/productos/ventas/compras/gastos/clientes/formulario`, `ver_kpis_venta`, `ver_ganancia_venta`, `ver_ganancia_producto`); `rolesClient.ts` → `resolverNegocioActual`; hooks `useRolActual`, `useRolePermissions`, `useUserRole`. Invitaciones por token en `/invitacion/[token]` (`src/lib/invitaciones.ts`); registro/invitaciones **sin correos**.
- **Plan efectivo**: `computeEffectivePlan` (`src/lib/planGating.ts`): Plus pagado (`pro_until > now`) > prueba vigente > Básico; Pro legado se interpreta como Plus. Catálogo de features en `FEATURES` (basic/business_plus). `src/lib/planLimits.ts` (servidor): `checkTrialStatus` (persiste downgrade), `checkEnvioLimit`, `checkRecordLimit`, `checkShalomExportLimit` → 403.
- **Doble gating**: UI (`LockedFeature`, `ModalUpgrade`) **y** servidor. Para básicos el servidor neutraliza la config Pro (hora de corte, cupo, etc.). Cron `/api/cron/downgrade-plans` baja planes vencidos.
- Pagos: `src/lib/mercadopago.ts`, `pagos.ts`, `facturacion.ts`; rutas `/api/mercadopago/*`, `/api/payment/*`, webhook `/api/webhooks/mercadopago` (exige `MP_WEBHOOK_SECRET`).

## Dominio

- **Estados de envío**: `NO_EMPACADO → EMPACADO → EN_OBSERVACION → ENVIADO` (`ESTADOS_ENVIO`). Crear envío = `NO_EMPACADO`. Al pasar a `ENVIADO`, `sincronizarVentasEnviadas` marca `ventas.estado_envio='COMPLETADO'` vía `envio_id`.
- Pedidos del formulario público no traen items; el vendedor los vincula a ventas en `ModalDetalle` ("Validar contenido").
- **Logística** (`src/lib/logistica/*`): hora de corte, cupo diario, anticipación mínima, días hábiles, días deshabilitados, fecha de entrega. Tarifas moto por distrito (`tarifas_moto`, `src/data/distritos-moto.json`, `normalizarDistrito.ts`).
- **Agencias Olva/Shalom**: datos en `src/data/*.json`, sync en `src/lib/{olva,shalom}/sync.ts`, rutas `/api/{olva,shalom}/sync` (cron lunes 05:00/06:00 UTC o POST con header `x-sync-key` = `OLVA_SYNC_SECRET`/`SHALOM_SYNC_SECRET`).
- **Stock/kardex**: `src/lib/stock.ts`, `sincronizarArchivoStock.ts`, RPCs `rpc-stock.sql`, `rpc-venta-atomico.sql` (venta atómica), `kardex-movimientos.sql`. Ventas con abonos (`venta-abonos.sql`), anulación, edición.
- Exportes: Shalom (`app/f/[slug]/lib/shalomExport.ts`, `ModalExportShalom`), Excel/texto de moto (`src/components/copiar-datos/*`), etiquetas (`ModalEtiquetas`), QR (`html5-qrcode`, `qrcode.react`).

## Mapa del código

```
proxy.ts                       barrera UX de rutas
app/
  page.tsx                     landing
  login | register | reset-password | onboarding | invitacion/[token]
  dashboard/page.tsx           dashboard completo (~1470 líneas, orquesta pestañas y modales)
  admin/page.tsx               super-admin
  f/[slug]/page.tsx            formulario público;  lib/supabase/admin.ts = cliente service role
  auth/callback, auth/impersonar
  api/                         route handlers: admin, auth, clientes, compras, configuracion, cron,
                               dashboard, envios (+bulk/count/export/productos/[id]/ventas), gastos,
                               logistica/moto, mercadopago, olva, onboarding, payment, personas, plan,
                               productos (+movimientos), register, roles (+accept/invitations/members),
                               session, shalom, tarifa-moto, tracking, uploads/producto, usage/shalom,
                               ventas (+abonos/migrate), webhooks/mercadopago
src/
  components/                  Seccion* (Ventas, Productos, Compras, Gastos, Clientes, Formulario), Modal*,
                               PanelResumen, Onboarding*, landing/*, ui/* (Button, Modal, Select, Field…), admin/*
  lib/                         lógica de negocio y auth (ver arriba)
  hooks/                       useEsMovil, usePolling, useRol*…
  context/OnboardingContext    tours guiados (src/lib/tours.ts)
  types/                       config.ts, envio.ts, inventario.ts
supabase/                      scripts SQL SIN numerar (esquema, migraciones, RPCs, RLS); instalacion-completa.sql = generado
scripts/local-db/              stack local (stack.mjs, gateway.mjs, dev.mjs, setup.mjs, sql/00-bootstrap, 01-base-tables)
e2e/                           Playwright (+ support/); README.md explica cada spec
docs/                          GUIA_SISTEMA.md, MANUAL_FUNCIONAL_TORI.md, WINDOWS-BLOCKED-NATIVE-MODULES.md
```

## Base de datos

- Esquema = scripts de `supabase/*.sql` sin orden propio. **El orden canónico es `SCHEMA_ORDER` en `scripts/local-db/stack.mjs`.** Las tablas `profiles`, `envios`, `tarifas_moto` se crearon a mano en prod: su definición está en `scripts/local-db/sql/01-base-tables.sql`.
- **Al agregar una migración**: crear `supabase/<nombre>.sql` (idempotente), añadirla a `SCHEMA_ORDER`, correr `npm run db:instalacion` para regenerar `instalacion-completa.sql`, y aplicarla a mano en el SQL Editor de Supabase (no hay herramienta de migraciones).
- Bucket público de Storage necesario: `logos` (y `productos` para fotos de producto).

## Tests

- e2e usan stack local efímero (nunca la base real); crean usuarios `@e2e.test` con IP falsa por contexto (`x-forwarded-for`). Secretos de prueba: `CRON_SECRET=local-cron-secret`, `MP_WEBHOOK_SECRET=local-webhook-secret`.
- Specs: landing, configuracion, movil (360/390 px), auth, core-flows, dashboard, security, no-leaks, resumen, idioma, unit.
- **Si `security.spec.ts` o `no-leaks.spec.ts` fallan, no desplegar.** Tras cambios de UI revisar `movil.spec.ts` (sin desbordes horizontales).
- Estado de verificación: `npm run lint` y e2e son la referencia; no hay tests unitarios fuera de `e2e/unit.spec.ts`.

## Entorno / despliegue

- `.env.local` (no versionado; plantilla `.env.local.sample`): 3 de Supabase (obligatorias), `NEXT_PUBLIC_SITE_URL`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `CRON_SECRET` (obligatoria en prod), `OLVA_SYNC_SECRET`, `SHALOM_SYNC_SECRET`, `NEXT_PUBLIC_GA_ID`.
- Deploy en **Vercel**; crons en `vercel.json` (shalom sync lun 05:00, olva sync lun 06:00, downgrade-plans diario 06:00 UTC).
- `next.config.ts`: `distDir` configurable (`NEXT_DIST_DIR`; el stack local usa `.next-local` para convivir con `next dev`), `agentRules: false`.
- Windows 11: si Next/Tailwind fallan con "Cannot find native binding" / "Application Control policy", ver `docs/WINDOWS-BLOCKED-NATIVE-MODULES.md` (Smart App Control).
- Repo: `github.com/1998fm/envios-pe`. Rama principal `main`; trabajo reciente en `secure_tori` (seguridad, arquitectura solo-servidor, e2e, vista móvil, resumen nuevo, roles en prueba, configuración, registro sin correos).

## Esquema de datos (tablas y RPCs principales)

- **Tablas**: `profiles` (negocio = usuario; config del formulario, métodos `metodo_*`, logística `logistica_moto_*`/`logistica_agencias_*`, `plan`, `trial_end`, `pro_until`, `slug`, `disabled`), `envios` (**FK `user_id`**), `envio_items`, `tarifas_moto` (jsonb por `profile_id`), `personas`/`cliente_de` (clientes; en código se llama "clientes" y "personas"), `productos`, `movimientos_inventario` (kardex), `ventas`, `venta_items`, `venta_abonos`, `compras`, `compra_items`, `gastos`, `pagos`, `plan_features`, `business_roles`, `business_members`, `business_invites`, `agencias_olva`, `agencias_shalom`, `shalom_exports`, `admin_audit_log`, `secuencias_codigos`, `limpieza_envios_log`.
- **OJO con la columna dueño**: `envios.user_id`, pero la mayoría del resto (`ventas`, `productos`, `compras`, `gastos`, `tarifas_moto`…) usa `profile_id`. Verifica en el SQL antes de escribir queries.
- **RPCs** (atomicidad/stock): `anular_venta_atomico`, `editar_venta_atomico`, `eliminar_venta_atomico`, `descontar_stock`, `restar_stock`, `sumar_stock`, `ajustar_stock`, `asignar_codigo_envio`/`asignar_codigo_venta`/`next_codigo_correlativo` (códigos correlativos), `limpiar_envios_basico_antiguos` (borra envíos ENVIADO de +30 días solo del plan Básico; las ventas se conservan con `envio_id`=NULL, con regla de gracia si alguna vez pagó), guardado de configuración (`rpc-guardar-configuracion.sql`). Operaciones de stock/ventas deben ir por RPC, no por UPDATEs sueltos.
- `01-base-tables.sql` (stack local) declara el CHECK `estado_valido` con 3 estados; `envio-estado-observacion.sql` lo amplía a 4 (`EN_OBSERVACION`) — por eso el orden en `SCHEMA_ORDER` importa.
- `plan-3-planes.sql` migró todos los `pro` existentes a `business_plus` (conservando `trial_end`/`pro_until`).

## Planes y precios (fuente de verdad: `src/lib/planGating.ts` FEATURES + `src/lib/mercadopago.ts` PRECIOS_PLAN + tabla `plan_features`)

| | Básico | Plus (`business_plus`) |
|---|---|---|
| Precio | gratis | S/ 49.90/mes · S/ 129.90/3 meses |
| Solicitudes de envío | ilimitadas | ilimitadas |
| Pedidos | búsqueda, filtros y gestión individual | además copia, exportación, etiquetas, Shalom Pro y acciones masivas |
| Operación | bloqueada | productos, inventario, ventas, compras, gastos, clientes, resumen y reportes |
| Configuración | mantiene las restricciones anteriores (2 métodos, sin funciones Plus) | completa |
| Equipo | sin miembros | hasta 4 miembros |

- Fuente de política: `planGating.ts` (catálogo, precios compartidos y días de prueba), `getPlanFeatures` (servidor). La política de dos planes se aplica aun si la tabla `plan_features` contiene valores anteriores; `max_metodos` de Básico conserva su ajuste en DB.
- `requirePlus` agrega la comprobación de plan vigente a las rutas de operación; `requirePlusOwner` hace lo propio para administrar el equipo. El rol por sí solo no habilita herramientas Plus.
- `plan-basico-plus.sql` sincroniza el catálogo de DB y migra perfiles Pro sin tocar vencimientos ni recibos. No es requisito para que el código aplique los bloqueos nuevos. Aplicar solo esta migración a una base existente, nunca `instalacion-completa.sql`.
- Nuevas suscripciones: solo `business_plus`; mensual y trimestral usan frecuencias de 1 y 3 meses respectivamente. Webhook y conciliación siguen aceptando referencias Pro anteriores; registran el recibo original y habilitan Plus sin cambiar importes ni fechas pagadas.
- Las pruebas existentes mantienen su fecha de fin; los 14 días se aplican a los nuevos registros. Ningún cambio en la política de limpieza del historial de envíos.

## Centro de soporte del superadmin

- `/admin` abre `AdminSupportCenter`: búsqueda de negocios, diagnóstico, configuración, pedidos, acceso Plus, cuenta/sesión e historial. Los módulos de facturación, agencias, actividad y administradores siguen disponibles en la navegación lateral.
- API `/api/admin/empresas/[id]/soporte`: solo cookie de superadmin activo, selección explícita de campos; nunca devuelve credenciales de infraestructura ni los objetos completos de Auth.
- Correcciones con motivo obligatorio, previsualización antes/después y comprobación de versión al guardar. Se registra una intención de auditoría antes de modificar y el resultado después. Sin tabla de auditoría, falla cerrado.
- Permite corregir empresa/enlace/contacto, cierre del formulario, métodos/días de entrega/origen Shalom; corregir pedidos del negocio seleccionado; ampliar acceso Plus; pasar a Básico conservando recibos; bloquear/reactivar, generar nueva contraseña y preparar acceso de soporte. No realiza cobros ni cancela suscripciones de MercadoPago.
- Contraseñas y enlaces de soporte son efímeros en la interfaz y nunca se incluyen en auditoría. La propia cuenta no se puede bloquear ni degradar desde estos controles.
- Usa tablas existentes: no necesita una migración adicional. Pruebas en `e2e/admin-support.spec.ts`, además de `security`, `no-leaks` y `core-flows`.

## Gotchas / decisiones no obvias

- **Zona horaria Perú (UTC-5, sin DST)**: las fechas se guardan en UTC; filtros por día se calculan con `-05:00` (ver `app/api/envios/route.ts`). No uses la hora local del servidor (Vercel = UTC).
- **Contraseña**: 8–72 caracteres (validado en `/api/register`); docs antiguas dicen 6. Registro limitado a 5/hora por IP; tracking público 15/10 min por IP (exige DNI **y** teléfono).
- **Tracking público** (`/api/tracking`) y **pedidos públicos** filtran por `user_id` del negocio: un DNI repetido en varios negocios nunca se mezcla.
- **Respuesta de listados**: `{ data, total, offset, limit }`; errores `{ error: "mensaje en español" }` con status HTTP real (400/401/403/429/500). `api()` del cliente lanza `ErrorApi` en no-2xx.
- **Búsqueda** (`src/lib/buscar.ts`) por palabras; va DESPUÉS de estados/método/fechas en la query (si no, se saltaba los filtros).
- Subidas de imagen: PNG/JPG/WEBP/GIF, máx 3 MB, siempre validadas en servidor (`configuracionNegocio.ts`, `/api/uploads/producto`); el cliente comprime con `comprimirImagen.ts`. URLs guardadas en forma canónica y servidas vía `/media` (`mediaUrl.ts`: `aProxy`/`desdeProxy`).
- Idempotencia de envíos públicos: `envios-idempotencia.sql`.
- `dashboard/page.tsx` es un monolito (~1470 líneas, estado de envíos, filtros, modales, polling cada 10 s con `usePolling`); las demás pestañas ya son componentes `Seccion*`. Preferir extraer en vez de seguir creciendo.
- Vista móvil: `useEsMovil` + barra inferior; cualquier tabla/modal nuevo debe verse bien a 360 px (cubierto por `movil.spec.ts`).
- Marca/estilo: paleta `tori-*` en `app/globals.css` (Tailwind 4 `@theme`, azul `#1397df` como 500), fuentes Geist, mascota `ToriMascot`/`LogoTori`. Componentes base reutilizables en `src/components/ui/`.
- `export` de `xlsx` se hace en el cliente; `html5-qrcode` solo en navegador (no importar en servidor).
- Tours guiados/ayuda: `src/lib/tours.ts`, `OnboardingContext`, `FloatingChat`, `TourHelpButton`.
- Super admin = `profiles.role = 'super_admin'` (`super-admin.sql`); `profiles.disabled = true` bloquea la cuenta (lo revisa `requireNegocio`). `/api/admin/*` pasa por `adminAuth`; auditoría en `admin_audit_log`; impersonación vía `/auth/impersonar`.

## Flujo de trabajo recomendado en una sesión nueva

1. `git status` / `git log -5` y confirma rama (`secure_tori` es la activa; `main` para PRs).
2. `npm install` (+ `npx playwright install chromium`, `npm run db:setup` si vas a probar e2e o `dev:local`).
3. Copia `.env.local.sample` → `.env.local`. Para trabajar sin tocar datos reales usa **`npm run dev:local`** (no necesita Supabase).
4. Tras cualquier cambio: `npm run lint` y `npx tsc --noEmit`; para cambios de lógica/API corre el spec relacionado: `npx playwright test e2e/<spec>.spec.ts` (con `E2E_HEADLESS=1` para ir rápido).
5. Cambios que toquen auth, permisos, planes o API → correr `security.spec.ts`, `no-leaks.spec.ts`, `core-flows.spec.ts`.
6. Cambios en SQL → seguir el procedimiento de migraciones de la sección "Base de datos".
7. Windows: el shell principal es PowerShell/Git Bash; rutas con `\` o `/` funcionan; si `next` falla por binarios nativos, ver doc de Smart App Control. `.idea/` y `.local-db/` son locales, no versionados.

## Desfases conocidos (no confíes ciegamente en la doc)

- `docs/GUIA_SISTEMA.md` habla de planes Básico/Pro, de `app/middleware.ts` y de APIs "sin autenticación por sesión": **obsoleto**. Hoy hay 2 planes comerciales, `proxy.ts` y `requireNegocio`. Los límites reales están en `src/lib/planGating.ts` (`FEATURES`), no en esa guía/README.
- README menciona `x-vercel-cron` y Realtime; hoy el cron usa `CRON_SECRET` y se usa polling.
- `README.md` dice `app/f/[slug]/lib/` con helpers de Supabase de cliente; ahora solo queda el cliente admin de servidor.

## Convenciones

- Español en UI, errores, comentarios y nombres de dominio (`envios`, `ventas`, `negocio`, `permisos`); archivos de componentes en PascalCase, libs en camelCase.
- Rutas nuevas: empezar con `requireNegocio(...)` (o `adminAuth`/`cronAutorizado`/rate limit si es público), filtrar siempre por `ownerId`, validar ids con `idsValidos`, traducir errores con `erroresEs`, y respetar límites de plan en servidor además de la UI.
- No introducir `NEXT_PUBLIC_*` con datos de Supabase ni importar `@supabase/*` en componentes de cliente.
- Commits en el estilo del historial (`feat:`, `fix:`, `ui(...)`), mensajes en español o inglés indistintamente.
