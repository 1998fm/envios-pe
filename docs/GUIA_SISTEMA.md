# GUÍA TÉCNICA DEL SISTEMA — Tori

> Guía paso a paso de qué hace cada parte del sistema, cada botón y cada pantalla.
> Basada en el código fuente (`app/` y `src/`). Fechas de referencia: 2026.

---

## Índice

1. [Visión general y arquitectura](#1-visión-general-y-arquitectura)
2. [Autenticación (registro, login, contraseña, logout)](#2-autenticación)
3. [Onboarding de 4 pasos](#3-onboarding-de-4-pasos)
4. [Dashboard — estructura y navegación](#4-dashboard--estructura-y-navegación)
5. [Barra superior (TopBar)](#5-barra-superior-topbar)
6. [Menú lateral (DashboardMenu)](#6-menú-lateral-dashboardmenu)
7. [Tab Resumen (PanelResumen)](#7-tab-resumen-panelresumen)
8. [Tab Envíos](#8-tab-envíos)
9. [Tab Ventas](#9-tab-ventas)
10. [Tab Productos](#10-tab-productos)
11. [Tab Compras](#11-tab-compras)
12. [Tab Gastos](#12-tab-gastos)
13. [Detalle de un pedido (ModalDetalle)](#13-detalle-de-un-pedido-modaldetalle)
14. [Acciones masivas: Shalom, cambio masivo, etiquetas y copiar datos](#14-acciones-masivas)
15. [Configuración (ModalConfiguracion)](#15-configuración-modalconfiguracion)
16. [Modal de planes (ModalUpgrade)](#16-modal-de-planes-modalupgrade)
17. [Centro de ayuda flotante y tours guiados](#17-centro-de-ayuda-flotante-y-tours-guiados)
18. [Formulario público (f/[slug])](#18-formulario-público-fslug)
19. [Planes y gating de funciones](#19-planes-y-gating-de-funciones)
20. [API REST](#20-api-rest)
21. [Supabase: clientes, esquema y RLS](#21-supabase-clientes-esquema-y-rls)
22. [MercadoPago (suscripción Pro)](#22-mercadopago-suscripción-pro)
23. [Notas técnicas y de seguridad](#23-notas-técnicas-y-de-seguridad)

---

## 1. Visión general y arquitectura

**Qué es Tori:** un sistema web para emprendedores peruanos que venden por WhatsApp/Instagram/redes. Les da:

- Un **formulario público** con la marca del negocio para que los clientes registren sus envíos solos (`/f/[slug]`).
- Un **dashboard** donde cada pedido llega ordenado: qué despachar, qué cobrar, qué comprar.
- Gestión de **ventas, productos, compras y gastos** con control de stock.
- **Logística** por método de envío: motorizado, Shalom, Olva, Marvisur, Flores, método propio y recojo.
- Planes **Básico** y **Pro** con gating de funciones por UI y por servidor.

**Stack:**

| Capa | Tecnología |
|---|---|
| Framework | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Animaciones | framer-motion |
| Gráficas | recharts |
| Excel | `xlsx` (client-side) |
| Notificaciones | sonner (`Toast`) |
| Iconos | lucide-react |
| Base de datos / Auth / Storage | Supabase (Postgres + Auth + Storage) |
| Pagos | MercadoPago (preapproval / suscripción) |
| Analítica | Google Analytics (`GoogleAnalytics.tsx`) |

**Estructura de carpetas principal:**

```
app/
├── layout.tsx            # Layout raíz: fonts, Providers, GA, Toaster, JSON-LD, metadata
├── page.tsx              # Landing (renderiza LandingPage)
├── middleware.ts         # Protección de rutas (login/register/dashboard/onboarding)
├── login/                # Iniciar sesión
├── register/             # Crear cuenta
├── reset-password/       # Nueva contraseña (viene de email de recuperación)
├── onboarding/           # Wizard post-registro (4 pasos + éxito)
├── dashboard/page.tsx    # Dashboard completo (1479 líneas)
├── f/[slug]/             # Formulario público del negocio
└── api/                  # Rutas de API (server)
src/
├── components/           # Todos los componentes de UI
├── context/              # OnboardingContext (tours)
├── lib/                  # planGating, planLimits, tours, logistica, mercadopago, sincronizarVentasEnviadas
├── types/                # config.ts, inventario.ts
└── data/                 # agencias-shalom.json, provincias-olva.json, distritos-moto.json
```

**Clientes de Supabase (importante):**

| Cliente | Archivo | Key | Dónde se usa |
|---|---|---|---|
| `supabase` | `app/f/[slug]/lib/supabase.ts` | anon | legacy/global |
| `createClient` (browser) | `app/f/[slug]/lib/supabase/client.ts` | anon (cookies) | Componentes `'use client'` |
| `createClient` (server) | `app/f/[slug]/lib/supabase/server.ts` | anon | Server components (lee perfiles públicos) |
| `createClient` (admin) | `app/f/[slug]/lib/supabase/admin.ts` | **service_role** | **Todas** las rutas `/api/*` (bypass RLS) |

> **Regla de oro del sistema:** las **lecturas/escrituras del dashboard sobre envíos** (cambiar estado, tamaño, fecha, eliminar, cambio masivo) se hacen **directo con el cliente del navegador** (RLS permite al dueño). Las rutas `/api/*` usan `service_role` y se encargan de crear registros con reglas de negocio (límites de plan, stock, cálculo de fechas).

---

## 2. Autenticación

### Registro — `app/register/page.tsx`
- Formulario: **empresa**, **email**, **password** (mín. 6).
- `POST /api/register` → crea el usuario en Auth y su perfil con **plan Pro trial 30 días** (ver §19).
- Al terminar hace **auto-login** (`signInWithPassword`) y redirige a `/onboarding`.

### Login — `app/login/page.tsx`
- Login por **password** (no magic link): `supabase.auth.signInWithPassword` → `/dashboard`.
- Botón **"¿Olvidaste tu contraseña?"** → `resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })` (envía email de recuperación).

### Reset contraseña — `app/reset-password/page.tsx`
- Espera el evento `PASSWORD_RECOVERY` de `onAuthStateChange` (timeout 3 s).
- Valida contraseña ≥ 6 y que coincida con la confirmación.
- `supabase.auth.updateUser({ password })` → redirige a `/dashboard`.

### Middleware — `app/middleware.ts`
- Crea un `createServerClient` con manejo de cookies.
- Redirecciones:
  - Sin sesión en `/dashboard/*` → `/login`.
  - Sin sesión en `/onboarding` → `/register`.
  - Con sesión en `/login` o `/register` → `/dashboard`.
- **No protege** `/f/[slug]` (es público) ni `/api/*`.

### Logout
- Botón con icono de salir (`LogOut`, title "Cerrar sesión") en `DashboardTopBar`.
- Ejecuta `supabase.auth.signOut()` y redirige a `/login`.

---

## 3. Onboarding de 4 pasos

Archivos: `app/onboarding/page.tsx` → `src/components/OnboardingWizard.tsx` + `OnboardingStep1..4`.

- **Paso 1 — Tu negocio** (`OnboardingStep1Empresa`): *Nombre del negocio*, *Teléfono*, *Dirección* (opcional), *Logo* (input file + preview). Guarda con `guardarPasoEmpresa` (sube logo a bucket `logos/{userId}/logo.{ext}`, valida slug único, `UPDATE profiles`).
- **Paso 2 — Métodos** (`OnboardingStep2Metodos`): 7 checkboxes de métodos (Motorizado, Shalom, Olva, Marvisur, Flores, Otro, Recojo) **sin límite de 2** (el límite aplica solo en el modal de config para básico). Condicionales: nombre del otro método, mensaje de recojo, agencia Shalom de origen.
- **Paso 3 — Horarios** (`OnboardingStep3Logistica`): `ConfiguracionMetodo` para Motorizado y Agencias (**siempre editable** aquí, porque al registrarse eres Pro trial): días de atención, hora de corte, cupo diario.
- **Paso 4 — Precios** (`OnboardingStep4Tarifas`): tarifas de motorizado por distrito (39 distritos). Permite **"Precio único para todos los distritos"** + botón *Aplicar a todos*, buscador y lista con input por distrito. Guarda con `UPSERT tarifas_moto`.
- **Paso 5 — Éxito**: confetti, resumen (métodos activados, distritos con tarifa, "Pro · 30 días gratis"), link `/f/{slug}` copiable y botón **"Ir a mi dashboard"**.

**Botones comunes del wizard:**
- **"Configurar después"** (header) → salta el onboarding.
- **"Atrás"** → paso anterior (deshabilitado en paso 1).
- **"Siguiente"/"Finalizar"** → guarda el paso actual (deshabilitado si `saving` o si paso 1 sin nombre de negocio).
- **"Ir a mi dashboard"** / saltar → ejecutan `clearAllTours()` y `router.push('/dashboard')` (esto reinicia los tours para que el usuario recién llegado vea el trayecto guiado).

---

## 4. Dashboard — estructura y navegación

Archivo: `app/dashboard/page.tsx` (componente `'use client'`).

- **Navegación por tabs:** es 100% por estado local `pestañaActiva` (`'resumen' | 'envios' | 'ventas' | 'productos' | 'compras' | 'gastos'`), **sin URL por sección**. El tab por defecto es `'resumen'`.
- El `DashboardMenu` y `PanelResumen` reciben la función `onNavegar` para cambiar de tab.
- **Carga inicial** (`cargar()`):
  1. `supabase.auth.getUser()`; sin sesión → `/login`.
  2. Upsert de `profiles` (crea el perfil si no existe).
  3. Lee perfil completo (empresa, slug, plan, trial_end, pro_until, métodos, logística, redes, logo, redirect) y `tarifas_moto`.
  4. `computeEffectivePlan(profile)` → `plan` + `diasRestantes` (ver §19).
  5. Carga envíos (`GET /api/envios`), productos, ventas, compras, gastos, uso Shalom (solo básico) y se suscribe a **Realtime** de `envios` (INSERT → recarga).
  6. Escucha el evento global `open-upgrade` para abrir `ModalUpgrade`, y procesa el retorno de MercadoPago `?payment=success|failure|pending`.

**Layout del tab:** `DashboardTopBar` (arriba) + `DashboardMenu` (sidebar izquierdo) + contenido del tab + modales al final.

---

## 5. Barra superior (TopBar)

Archivo: `src/components/DashboardTopBar.tsx`.

| Elemento | Qué hace |
|---|---|
| **Logo** | Muestra `logoUrl` del negocio o el logo de Tori + nombre "Tori". |
| **Badge de plan** | `Pro · Trial {n}d` (ámbar, si trial con días), `Pro` (degradado), o `Básico` (gris). |
| **Botón "Compartir formulario"** | Copia `${origin}/f/{slugEmpresa}` al portapapeles y muestra toast "Formulario copiado". |
| **Botón logout** (icono salir) | `signOut()` → `/login`. |
| **Banner trial (≤5 días)** | "Tu prueba gratuita termina…" + botón **"Ver planes"** → abre `ModalUpgrade`. |
| **Banner básico** | "Estás en el plan Básico…" + botón **"Ver planes"** → abre `ModalUpgrade`. |

> No tiene búsqueda global ni notificaciones. La búsqueda por cliente está en el tab Envíos (`FilterBar`) y la de productos en su tab.

---

## 6. Menú lateral (DashboardMenu)

Archivo: `src/components/DashboardMenu.tsx`. Sidebar colapsable (con `Pin` para fijarlo, `ChevronLeft` para plegar y un botón hamburguesa flotante para abrirlo).

**Secciones (orden y acción):**

| Sección | Icono | Acción |
|---|---|---|
| Resumen | LayoutDashboard | `pestañaActiva='resumen'` |
| Envíos | Boxes | `pestañaActiva='envios'` |
| Ventas | ShoppingCart | `pestañaActiva='ventas'` |
| Productos | Package | `pestañaActiva='productos'` |
| Compras | Truck | `pestañaActiva='compras'` |
| Gastos | Receipt | `pestañaActiva='gastos'` |

Cada sección tiene un botón `TourHelpButton` (ver §17).

**Acciones del menú (visibles con el menú abierto):**

| Acción | Gating | Qué hace |
|---|---|---|
| **Shalom Pro** | Solo si el negocio usa Shalom. En básico muestra `used/max` del mes | `onExportShalom` → abre `ModalExportShalom` |
| **Cambio Masivo** | Solo **Pro**; en básico se muestra como `LockedFeature` | Abre `ModalCambioMasivo` |
| **Generar etiquetas** | Siempre | Abre `ModalEtiquetas` (requiere ≥1 envío seleccionado) |
| **Copiar datos** | Solo si hay envíos Motorizado seleccionados; >50 en básico = `LockedFeature` | Abre `ModalCopiarDatos` |
| **Configuración** | Siempre | Abre `ModalConfiguracion` |

---

## 7. Tab Resumen (PanelResumen)

Archivo: `src/components/PanelResumen.tsx`. Fuente: `GET /api/dashboard?user_id=`.

- **Banner "Saldo disponible"** = `totalVentas − totalCompras − totalGastos`. Verde degradado si ≥ 0, rojo si negativo. Muestra subtotales de Ventas / Compras / Gastos. Sin botones.
- **7 tarjetas KPI** (informativo, sin clic):
  1. *Ventas del mes* (S/, con delta % vs mes anterior).
  2. *Ventas hoy* (S/).
  3. *Cobros pendientes* (nº + S/).
  4. *Por despachar* (nº + "X empacados").
  5. *Envíos del mes* (nº).
  6. *Gastos del mes* (S/).
  7. *Stock bajo* (nº productos).
- **"Pendiente de acción"** — 4 tarjetas **navegables**:
  - *Sin empacar* → `pestañaActiva='envios'`.
  - *Por enviar* → `'envios'`.
  - *Por cobrar* → `'ventas'`.
  - *Productos bajo stock* → `'productos'`.
- **Gráficos** (informativos): *Pedidos últimos 30 días* (línea), *Ventas por método de pago* (pastel: Efectivo/Yape/Plin/Tarjeta), *Envíos por estado* (pastel), *Envíos por método* (barras).
- **Recientes**: tarjetas *Últimos pedidos*, *Últimas ventas*, *Últimos gastos* (filas sin clic).
- **Estado vacío**: mascota Tori + "Aún no hay datos. Crea tu primer pedido o registra una venta…".

> No existe botón "Ver todo" ni "Nuevo pedido" en Resumen. El alta de pedidos ocurre solo por el formulario público.

---

## 8. Tab Envíos

Se renderiza dentro de `app/dashboard/page.tsx`: `FilterBar` + `EnvioGroupedList` + botón **"Cargar más envíos"**.

### Filtros — `src/components/FilterBar.tsx`
- **Input de búsqueda** "Buscar por nombre, DNI o teléfono..." → recarga `GET /api/envios?busqueda=`.
- **MultiSelect "Estado"** (default: No Empacado + Empacado): No Empacado / Empacado / Enviado.
- **MultiSelect "Método"**: opciones según métodos activos del negocio.

### Lista agrupada — `src/components/EnvioGroupedList.tsx`
- Checkbox **"Seleccionar todos"** (todos los visibles) + contador "(n seleccionados)".
- Botones **"Programada"** / **"Registro"**: agrupan por `fecha_programada` o `fecha_registro`. "Sin fecha programada" va al final.
- Estados de un envío: `NO_EMPACADO` (No Empacado), `EMPACADO` (Empacado), `ENVIADO` (Enviado).

### Tarjeta de envío — `src/components/EnvioCard.tsx`
| Elemento | Qué hace |
|---|---|
| **Checkbox** | Marca el envío para acciones masivas. |
| **Doble clic** en la tarjeta | Abre `ModalDetalle` del pedido. |
| **TamanoSelect** | Cambia el tamaño del paquete (Sin definir, XS, S, M, L) → `UPDATE envios` directo. |
| **EstadoSelect** | Cambia el estado → `UPDATE envios` directo; si pasa a `ENVIADO` sincroniza las ventas vinculadas a `COMPLETADO`. |

> **No hay** botones "despachar" ni "cancelar" en la tarjeta: *despachar = elegir Enviado* en el `EstadoSelect`; eliminar está en `ModalDetalle`; copiar/exportar están en el menú.

### Paginación
- Botón **"Cargar más envíos"** → `GET /api/envios` con `offset` incremental (limit 50). Solo si hay más.

---

## 9. Tab Ventas

Archivo: `src/components/SeccionVentas.tsx`. Tabla: Cliente, DNI, Productos, Total, Pago, Estado, Envío, Fecha, Acciones.

**Estados de venta:** `COMPLETADA`, `ANULADA`, `PENDIENTE`. **Métodos de pago:** Efectivo, Yape/Plin, Tarjeta.

| Botón | Qué hace |
|---|---|
| **"Nueva venta"** | Abre el modal de venta (carga `GET /api/productos`). |
| Filtros **"Completadas" / "Pendientes" / "Anuladas"** | Toggle; recarga `GET /api/ventas?estado=`. |
| **Ojo (detalle)** | Abre `ModalDetalleVenta`. |
| **Check (solo PENDIENTE)** | Confirma la venta → `PUT /api/ventas/{id}` `{estado:'COMPLETADA'}`. |
| **RotateCcw (Anular, solo COMPLETADA)** | Confirma y anula → `PUT /api/ventas/{id}` `{estado:'ANULADA'}` (restaura stock). |
| **X (Eliminar, si no es COMPLETADA)** | Confirma y elimina → `DELETE /api/ventas/{id}`. |

### Modal "Nueva venta"
1. **"Buscar cliente por DNI o teléfono"** (+ botón **Buscar**) → `GET /api/personas`. Si no existe: panel **"Cliente no encontrado — Regístralo"** con botón **"Registro rápido"** → inputs *Nombre*, *DNI*, *Teléfono* + **"Registrar cliente"** (`POST /api/personas`).
2. **"Buscar producto..."** → lista (deshabilita los sin stock). Click agrega al carrito.
3. Items de la venta: cantidad, precio unitario, botón X para quitar. Muestra subtotal y **Total**.
4. **Método de pago**: Efectivo / Yape / Plin / Tarjeta. Si es Tarjeta → aviso "el pago se registrará como **Pendiente**".
5. **"Cancelar"** / **"Crear venta"** → `POST /api/ventas` (descuenta stock; si 403 de límite → `openUpgrade`).

> No existe edición de venta; solo detalle / confirmar / anular / eliminar.

---

## 10. Tab Productos

Archivo: `src/components/SeccionProductos.tsx`. Tabla: Nombre, SKU, Stock, P. Venta, P. Compra, Und, Acciones.

| Botón | Qué hace |
|---|---|
| **Input "Buscar producto..."** | Filtra (local + `GET /api/productos?busqueda=`). |
| **"Nuevo"** | Abre modal "Nuevo producto". |
| **"Insertar ejemplos"** (solo lista vacía) | Crea 6 productos de ejemplo (6× `POST /api/productos`). |
| **Pencil (Editar)** | Convierte la fila en inputs inline (nombre, SKU, stock, precios, unidad). |
| **Check (Guardar)** | `PUT /api/productos/{id}`. |
| **X (Cancelar)** | Sale del modo edición sin guardar. |
| **Trash2 (Eliminar)** | Confirma y elimina → `DELETE /api/productos/{id}`. |

**Modal "Nuevo producto":** *Nombre* (genera SKU automáticamente), *SKU*, *Stock*, *Stock mín.*, *Precio venta (S/)*, *Precio compra (S/)*, *Unidad* (select). Botones **Cancelar / Crear** → `POST /api/productos`.

**Stock bajo:** la fila se pinta roja cuando `stock_actual <= stock_minimo && stock_minimo > 0`. Unidades posibles: unidad, kg, g, L, ml, m, cm, par, docena, caja, paquete, bolsa, botella, lata, tarro, rollo, pliego.

---

## 11. Tab Compras

Archivo: `src/components/SeccionCompras.tsx`. Tabla: Proveedor, Productos, Total, Estado, Fecha, Acciones.

| Botón | Qué hace |
|---|---|
| **"Nueva compra"** | Abre modal (carga `GET /api/productos`). |
| Filtros **"Completadas" / "Anuladas"** | Recarga `GET /api/compras?estado=`. |
| **Ojo (detalle)** | Abre `ModalDetalleCompra`. |
| **RotateCcw (Anular, solo COMPLETADA)** | Confirma y anula → `PUT /api/compras/{id}` `{estado:'ANULADA'}` (restaura stock). |
| **X (Eliminar, si no es COMPLETADA)** | Confirma y elimina → `DELETE /api/compras/{id}`. |

**Modal "Nueva compra":** *Proveedor*, *Buscar producto...* (click agrega o incrementa cantidad), items con cantidad/precio y botón X, **Total**. Botones **Cancelar / Registrar compra** → `POST /api/compras` (incrementa stock).

---

## 12. Tab Gastos

Archivo: `src/components/SeccionGastos.tsx`. Tabla: Fecha, Categoría, Concepto, Monto, Acciones. Muestra **"Total de la lista"**.

**Categorías:** Materiales, Pasajes, Delivery, Publicidad, Servicios, Otros.

| Botón | Qué hace |
|---|---|
| **"Registrar gasto"** | Abre el formulario vacío. |
| Filtros de categoría | Recarga `GET /api/gastos?categoria=`. |
| **Pencil (Editar)** | Pre-llena el formulario con el gasto. |
| **X (Eliminar)** | Confirma y elimina → `DELETE /api/gastos/{id}`. |

**Modal gasto:** *Categoría* (botones segmentados), *Concepto*, *Monto (S/)*, *Fecha*, *Notas (opcional)*. Botones **Cancelar** y **Guardar cambios** (si edita → `PUT /api/gastos/{id}`) / **Registrar gasto** (→ `POST /api/gastos`).

---

## 13. Detalle de un pedido (ModalDetalle)

Archivo: `src/components/ModalDetalle.tsx`. Se abre con **doble clic** en una tarjeta de envío. Muestra: Cliente (nombre, DNI, teléfono), Envío (método, estado, tamaño, fecha de registro), **Fecha programada**, Destino (`detalle`), y **"Productos del cliente"** (ventas COMPLETADAS del mismo DNI/teléfono).

| Elemento | Qué hace |
|---|---|
| **Input date "Fecha programada"** + **"Guardar"** | `UPDATE envios SET fecha_programada` (directo). |
| **"Validar contenido del pedido"** (si hay ventas sin empacar) | Confirma "¿todo lo listado ha sido empacado?" → `UPDATE ventas SET estado_envio='EMPACADO', envio_id` (directo). |
| **"Eliminar"** | Pide confirmación y elimina el envío → `DELETE envios` (directo). |
| **"Cerrar"** | Cierra el modal. |

---

## 14. Acciones masivas

### Exportar Shalom — `ModalExportShalom.tsx`
- Muestra mensaje según haya selección ("exportar los N envíos seleccionados") o no ("exportar todos los SHALOM empacados"), con origen Shalom y checkbox **"Marcar automáticamente como ENVIADO después de exportarlos"**.
- Botón **"Exportar" / "Exportar y enviar"** → `confirmarExportacion()`:
  1. Si **básico**: `POST /api/usage/shalom` (valida límite de 10/mes; si 403 → toast + `ModalUpgrade`).
  2. Genera **Excel** `envios-shalom.xlsx` (hoja "SHALOM": DESTINATARIO, TELF, ORIGEN, DESTINO, medidas según tamaño, etc.) con `shalomExport.ts`.
  3. Si el checkbox está activo: `UPDATE envios SET estado='ENVIADO'` (directo) + sincroniza ventas.
- Enlace **"Abrir Shalom Pro"** → `window.open('https://pro.shalom.pe')`.

### Cambio Masivo — `ModalCambioMasivo.tsx` (solo **Pro**)
- Selects: **Método**, **Estado actual**, **Nuevo estado** + checkbox **"Aplicar solamente a los pedidos seleccionados"** + resumen.
- Botón **"Aplicar cambios"** → arma `ids` (seleccionados o los que coinciden con método+estado) → `UPDATE envios SET estado` (directo); si nuevo estado es `ENVIADO` sincroniza ventas; toast "N pedidos actualizados".

### Generar etiquetas — `ModalEtiquetas.tsx` (ambos planes)
- Radio **"4 etiquetas por hoja"** (A4, distribución 2×2) / **"Etiqueta individual"**.
- Botón **"Imprimir"** → cierra el modal y ejecuta `window.print()` sobre la capa oculta `EtiquetasImpresion` (`#zona-impresion`): cliente, DNI, teléfono, detalle de entrega, logo y método.
- Requiere al menos 1 envío seleccionado (si no → toast "Selecciona al menos un envío").

### Copiar datos (Motorizado) — `src/components/copiar-datos/`
- Solo aparece cuando **todos** los envíos seleccionados son `MOTORIZADO`. En básico con >50 seleccionados → `LockedFeature`.
- `ModalCopiarDatos` muestra resumen **Pedidos / Cobrar envío / No cobrar**, y por envío un checkbox **"Cobrar envío"** (calcula la tarifa con `buscarTarifa(distrito, tarifas)`), además de **"Cobrar todos los envíos"**.
- Botón **"Copiar datos"** → copia al portapapeles un texto formateado (`generarTextoMoto`): *Cliente*, *TLF*, *DIRECCIÓN*, *REF*, *COBRAR: S/xx* o *NO COBRAR*.
- Botón **"Exportar Excel"** → genera `Pedidos_Motorizado.xlsx` (Cliente, Teléfono, Distrito, Dirección, Referencia, Cobrar).
- **Importante:** la marca "cobrar" es solo local para generar texto/Excel; **no registra el cobro** en la base de datos.

---

## 15. Configuración (ModalConfiguracion)

Archivo: `src/components/ModalConfiguracion.tsx`. Se abre desde el menú lateral. Tiene 4 pestañas:

### Pestaña "Empresa"
- **Datos del negocio**: *Nombre del negocio*, *Teléfono*, *Dirección* (opcional).
- **Agencia de origen (Shalom)**: autocomplete con 542 agencias (`agencias-shalom.json`).
- **Logo del negocio**: solo **Pro** (input file PNG/JPEG/WebP + preview). En básico → tarjeta bloqueada con botón **"Ver planes"**.
- **Mensaje de éxito**: texto que verá el cliente al pedir.
- **URL de redirección**: solo **Pro**.
- **Redes sociales**: Instagram, Facebook, TikTok, Web, WhatsApp. Solo **Pro** (en básico bloqueado).

### Pestaña "Métodos"
- Básico: "Selecciona hasta 2 métodos...". **Pro**: ilimitados.
- 7 tarjetas checkbox: Motorizado, Shalom, Olva, Marvisur, Flores, Otro, Recojo.
- En básico, si ya hay 2 activos, los demás quedan deshabilitados.
- `metodoOtro` → input *"Nombre del otro método"*; `metodoRecojo` → *"Mensaje para tus clientes al elegir Recojo"*.

### Pestaña "Logística"
- Bloque **Motorizado** y bloque **Agencias** (Shalom/Olva/Marvisur/Flores/Otro), cada uno con `ConfiguracionMetodo`:
  - **"¿Qué días atiendes?"** (`SelectorDias`: L M X J V S D) — editable también en básico.
  - **"Tengo hora de corte"** (hora, ej. 18:00). **Bloqueado en básico** (fila con candado → "Ver planes").
  - **"Limitar envíos por día"** (cupo). **Bloqueado en básico**.
- Banner ámbar "¿Necesitas más funciones?" + **"Ver planes"** en básico.

### Pestaña "Tarifas" (solo **Pro**)
- Tarifas de motorizado por distrito (input numérico por cada uno).

### Botones del modal
- **"Cancelar"** → cierra sin guardar.
- **"Guardar"** → `guardarConfiguracion()`:
  1. Sube el logo a storage `logos/{userId}/logo.{ext}` (si cambió).
  2. Valida slug único.
  3. `UPDATE profiles` con todos los campos de negocio, métodos, logística, redes, redirect.
  4. **Sanitiza logística en básico** (aunque la UI no lo deje editar): fuerza `usaHoraCorte=false`, `horaCorte='18:00'`, `anticipacion=1`, `limitar=false`, `cupo=0`.
  5. `UPSERT tarifas_moto` (onConflict `profile_id,distrito`).
  6. Toast "Configuración guardada".

---

## 16. Modal de planes (ModalUpgrade)

Archivo: `src/components/ModalUpgrade.tsx`. Se abre desde:
- Evento global `open-upgrade` (botones `LockedFeature`, 403 de límites, campos bloqueados de configuración, botones "Ver planes").
- El retorno `?payment=...` de MercadoPago.

Contenido:
- Toggle de periodo: **"Mensual"** (S/ 29.90/mes) / **"Trimestral"** (S/ 79.90 cada 3 meses).
- Card **Básico** (Gratis) y card **Pro** (RECOMENDADO) con listas de `FEATURES` (check ✓ o ✗ o valor numérico), precio tachado S/ 39.90 + "Promoción por tiempo limitado".
- Botón **de pago** → `POST /api/mercadopago/create-subscription` `{userId, periodo}` → redirige a `init_point` (MercadoPago).
- Si `planActual==='pro'` (trial): banner "al adquirir Pro no perderás los días de prueba restantes".

---

## 17. Centro de ayuda flotante y tours guiados

### `FloatingChat.tsx`
- Botón flotante (icono de ayuda, abajo a la derecha) → abre panel **"Hola, soy Tori"** con 12 FAQs.
- En el header/footer hay un enlace **"Quiero un tour guiado por el dashboard"** → `window.location.search = '?tour=start'`.

### Tours (`src/lib/tours.ts` + `src/context/OnboardingContext.tsx`)
- **TRAYECTO_INICIAL** (orden): `tab-resumen → tab-envios → tab-ventas → tab-productos → tab-compras → tab-gastos`.
- Al entrar al dashboard por primera vez (o con `?tour=start`), se navega de tab en tab disparando el tour de cada sección. **Inicia en Resumen.**
- "Saltar" termina todo el trayecto; completar el último lo cierra; el progreso se guarda en localStorage (`tori_trayecto_index`).
- Después del trayecto, cada modal dispara su propio tour automático (nueva venta, nueva compra, nuevo producto, nuevo gasto, detalle de pedido, configuración, cambio masivo, Shalom, etiquetas, copiar datos, upgrade).
- `TourHelpButton` (icono de información) permite lanzar el tour manualmente desde cada sección/modal.

---

## 18. Formulario público (f/[slug])

Archivo: `app/f/[slug]/page.tsx` (Server) + `src/components/PublicForm.tsx` (Client).

**Server (`[slug]/page.tsx`):**
- Lee `profiles` por `slug`. Si no existe → "No se encontró el perfil".
- Calcula `isPro = computeEffectivePlan(profile).plan === 'pro'`.
- Pasa al `PublicForm`: `isPro`, logo, métodos, `nombreMetodoOtro`, `mensajeRecojo`, redirect y redes.

**Client (`PublicForm`):** el cliente ve una sola tarjeta con:

| Paso / campo | Detalle |
|---|---|
| **Header** | Logo del negocio **solo en Pro** (marca blanca Pro). |
| **Datos personales** | *Nombre completo*, *DNI*, *Teléfono* (mín. 9). Nota: "Usa el mismo número con el que realizaste tu compra por WhatsApp." |
| **Método de envío** | Tarjetas: Motorizado, Shalom, Olva, Marvisur, Flores, Otro (nombre configurado), Recojo. Default: el primero disponible. |
| **Campos según método** | `SHALOM` → agencia (autocomplete 542). Agencias (`OLVA/MARVISUR/FLORES/OTRO`) → provincia (196), dirección, referencia. `MOTORIZADO` → distrito (39), dirección, referencia + **costo de envío en vivo**. `RECOJO` → mensaje informativo. |
| **Escoger día de entrega** | **Solo Motorizado y Pro**: checkbox → `GET /api/logistica/moto` → hasta 3 fechas disponibles (botones). |
| **Botón "Solicitar Envío"** | `POST /api/envios` con validaciones (nombre, documento, teléfono ≥9, datos de envío completos). |
| **Redes sociales** | **Solo Pro**: Instagram, Facebook, TikTok, Web, WhatsApp. |
| **Footer** | Link "Quiero usar Tori en mi emprendimiento" → `/`. |

**Pantalla de éxito (`SuccessScreen`):** confetti, "Pedido registrado correctamente", mensaje de éxito (solo Pro), fecha programada si el servidor la devolvió, y si hay `redirectUrl` (solo Pro) redirige a los 3 s.

**Cálculo de tarifa (motorizado):** al cambiar distrito → `GET /api/tarifa-moto?userId&distrito` → "S/ X.XX" (o "Sin tarifa").

**Gating del formulario:** logo, mensaje/URL de redirección, redes y "escoger día de entrega" son **Pro**. En básico, el servidor calcula la fecha programada automáticamente.

---

## 19. Planes y gating de funciones

### Catálogo (`src/lib/planGating.ts` → `FEATURES`)

| Feature | Básico | Pro |
|---|---|---|
| Envíos mensuales | 50 | Ilimitados |
| Métodos de envío | Hasta 2 | Ilimitados |
| Productos | 50 | Ilimitados |
| Ventas registradas | 100 | Ilimitados |
| Exportar a Shalom | 10 al mes | Ilimitado |
| Copiar datos | Hasta 50 pedidos | Ilimitado |
| Generar etiquetas | ✓ | ✓ |
| Compras | ✓ | ✓ |
| Gastos | ✓ | ✓ |
| Logo personalizado | ✗ | ✓ |
| Redes sociales en formulario | ✗ | ✓ |
| URL de redirección | ✗ | ✓ |
| Hora de corte, anticipación mínima y cupo diario | ✗ | ✓ |
| Tarifas por distrito | ✗ | ✓ |
| Cambio masivo de estados | ✗ | ✓ |
| Marca blanca en formulario | ✗ | ✓ |

### Plan efectivo — `computeEffectivePlan(profile)`
Precedencia (de mayor a menor):
1. **Pro pagado vigente**: `pro_until > now` → `{ plan:'pro', isTrial:false }`.
2. **Trial vigente**: `trial_end > now` **y** `plan==='pro'` → `{ plan:'pro', isTrial:true, diasRestantes }`.
3. Cualquier otro caso → `{ plan:'basic' }`.

`checkTrialStatus` (server, `planLimits.ts`) hace lo mismo pero además **persiste el downgrade** (`UPDATE profiles SET plan='basic', trial_end=null`) cuando expira sin pago.

### Doble capa de gating
- **UI (cliente):** pestaña Tarifas bloqueada, filas bloqueadas de logística, `LockedFeature` en menú, banners de upgrade, y sanitización al guardar configuración.
- **Servidor (APIs):** `checkEnvioLimit` (50/mes), `checkRecordLimit('productos'|'ventas')` (50/100), `checkShalomExportLimit` (10/mes) responden **403** con mensaje; y `POST /api/envios` / `GET /api/logistica/moto` **neutralizan la configuración Pro** para básicos (fuerzan `usaHoraCorte=false`, `horaCorte='18:00'`, `limitar=false`, `cupo=0`).

### Registro y pago
- Nuevo registro → `plan='pro'`, `trial_end = now + 30 días`, `pro_until = null`.
- Pago → webhook MercadoPago escribe `plan='pro'`, `pro_until = now + meses`.

---

## 20. API REST

Todas las rutas están en `app/api/`. Usan `service_role` (admin). **No validan sesión**: confían en `user_id`/`userId` del query o body.

| Método | Ruta | Qué hace | Gating |
|---|---|---|---|
| GET | `/api/envios?user_id&offset&limit&busqueda&estados&metodos` | Lista paginada (max 200), busca por nombre/DNI/teléfono, filtra estado/método, orden por fecha desc | — |
| POST | `/api/envios` | Crea envío (formulario público): lee perfil, calcula `fecha_programada` (respeta la elegida solo si Pro), crea/víncula persona y `cliente_de`, inserta con estado `NO_EMPACADO` | `checkEnvioLimit` (403) + logística Pro-only |
| GET | `/api/dashboard?user_id` | KPIs (ventas mes/hoy, cobros pendientes, por despachar, envíos del mes, gastos del mes, stock bajo), pendientes, deltas, gráficos de 30 días, recientes | — |
| GET/POST | `/api/usage/shalom` | GET: `{used,max}` del mes. POST: valida límite y registra exportación | `checkShalomExportLimit` (403) |
| GET | `/api/tarifa-moto?distrito&userId` | Precio de motorizado del distrito | — |
| GET | `/api/logistica/moto?userId` | 3 fechas disponibles para motorizado usando días/hora de corte/cupo | Básico: sin corte/cupo |
| GET/POST | `/api/productos` | Listar (busca por nombre) / crear | POST: `checkRecordLimit('productos')` |
| PUT/DELETE | `/api/productos/[id]` | Editar / eliminar | — |
| GET/POST | `/api/ventas` | Listar (filtro estado) / crear (descuenta stock; Tarjeta→PENDIENTE) | POST: `checkRecordLimit('ventas')` |
| PUT | `/api/ventas/[id]` | `COMPLETADA` (confirma pago) o `ANULADA` (restaura stock) | — |
| DELETE | `/api/ventas/[id]` | Eliminar (restaura stock si COMPLETADA) | — |
| POST | `/api/ventas/migrate` | Pasa todas las ventas PENDIENTE a COMPLETADA (utilidad) | — |
| GET/POST | `/api/compras` | Listar / crear (incrementa stock) | — |
| PUT | `/api/compras/[id]` | `ANULADA` (restaura stock) | — |
| DELETE | `/api/compras/[id]` | Eliminar (restaura stock) | — |
| GET/POST | `/api/gastos` | Listar (filtro categoría) / crear | — |
| PUT/DELETE | `/api/gastos/[id]` | Editar / eliminar | — |
| GET/POST | `/api/personas` | Buscar cliente (DNI→teléfono→parcial) / crear (dedupe por DNI/teléfono + vincula `cliente_de`) | — |
| POST | `/api/register` | Crea usuario Auth + perfil Pro trial 30 días (slug único) | — |
| POST | `/api/mercadopago/create-subscription` | Crea preapproval; devuelve `init_point` | — |
| POST | `/api/webhooks/mercadopago` | Verifica firma; `preapproval authorized` → `pro_until = now + meses` | — |

**Escrituras de envíos SIN ruta API** (cliente directo): cambiar estado/tamaño/fecha, eliminar envío, validar contenido, cambio masivo, marcar ENVIADO tras exportar Shalom, sincronización de ventas (`src/lib/sincronizarVentasEnviadas.ts`).

---

## 21. Supabase: clientes, esquema y RLS

### Tablas y columnas principales

- **profiles**: `id` (=auth user), `empresa`, `slug` (único), `plan` ('basic'|'pro'), `trial_end`, `pro_until`, `telefono`, `direccion`, `origen_shalom`, `logo_url`, `redirect_url`, `redirect_message`, `redirect_message_image`, redes (`instagram_url`, `facebook_url`, `tiktok_url`, `web_url`, `whatsapp_url`), métodos (`metodo_motorizado/shalom/olva/marvisur/flores/otro/recojo`), `nombre_metodo_otro`, `mensaje_recojo`, logística moto/agencias (`logistica_moto_dias[]`, `usa_hora_corte`, `hora_corte`, `anticipacion` (días mínimos, default 1), `limitar`, `cupo`).
- **envios**: `id`, `user_id`, `nombre`, `dni`, `telefono`, `metodo` (CHECK: MOTORIZADO/SHALOM/OLVA/MARVISUR/FLORES/OTRO/RECOJO), `nombre_metodo`, `destino`, `direccion`, `referencia`, `detalle`, `tamano` (XS/S/M/L), `estado` (NO_EMPACADO/EMPACADO/ENVIADO), `fecha_registro`, `fecha_programada`.
- **envio_items**: `envio_id` ↔ `venta_item_id`, `cantidad`.
- **personas**: `dni` (único, nullable), `nombre`, `telefono`.
- **cliente_de**: `persona_id`, `profile_id` (UNIQUE ambos).
- **productos**: `profile_id`, `nombre`, `sku`, `precio_venta`, `precio_compra`, `stock_actual`, `stock_minimo`, `unidad`.
- **ventas**: `profile_id`, `persona_id`, `persona_nombre`, `persona_dni`, `total`, `estado` (COMPLETADA/ANULADA/PENDIENTE), `metodo_pago` (EFECTIVO/YAPE_PLIN/TARJETA), `estado_envio` (PENDIENTE/EMPACADO/ENVIADO/ENTREGADO/COMPLETADO), `envio_id`.
- **venta_items**: `venta_id`, `producto_id`, `producto_nombre`, `cantidad`, `precio_unitario`, `subtotal`.
- **compras / compra_items**: idem ventas con `proveedor`.
- **gastos**: `profile_id`, `categoria` (MATERIALES/PASAJES/DELIVERY/PUBLICIDAD/SERVICIOS/OTROS), `concepto`, `monto`, `fecha`, `notas`.
- **tarifas_moto**: `profile_id`, `distrito`, `precio` (UNIQUE profile_id+distrito).
- **plan_features**: por plan: `max_envios`, `max_metodos`, `max_productos`, `max_ventas`, `max_exportaciones_shalom`, `max_pedidos_copiar`, y booleanos de features.
- **shalom_exports**: `id`, `user_id`, `cantidad`, `created_at`.
- **Storage**: bucket `logos` (`{userId}/logo.{ext}`).

### RLS (resumen de `supabase/rls-policies.sql`)
- `profiles`: SELECT público (necesario para `/f/[slug]`); INSERT/UPDATE/DELETE solo owner.
- `envios`: SELECT/UPDATE/DELETE owner; **INSERT solo vía API** (no hay policy de insert).
- `tarifas_moto`, `ventas`, `venta_items`, `compras`, `compra_items`, `gastos`, `productos`: owner.
- `personas`: RLS habilitada (accesos de escritura por API con service_role).
- `cliente_de`: SELECT owner.
- `envio_items`: vía EXISTS a `envios`.
- **Realtime**: `envios` (el dashboard se suscribe a INSERT).

---

## 22. MercadoPago (suscripción Pro)

- **`/api/mercadopago/create-subscription`**: `{userId, periodo}` → valida `mensual|trimestral` → obtiene email del usuario → `preApproval.create` con `external_reference = userId`, `auto_recurring` (PEN), `backUrl` al dashboard → devuelve `{ init_point, preapproval_id }`.
- **Webhook**: valida firma (`x-signature`, `x-request-id`, `MP_WEBHOOK_SECRET`). Si `topic === 'preapproval'` y `status === 'authorized'`: `meses = monto >= 70 ? 3 : 1`, `UPDATE profiles SET plan='pro', pro_until = now + meses`. En `cancelled` **no** se modifica `pro_until` (el período pagado se conserva hasta expirar y `checkTrialStatus` degrada solo).
- Precios (`src/lib/mercadopago.ts`): mensual S/ 29.90 (1 mes), trimestral S/ 79.90 (3 meses).

---

## 23. Notas técnicas y de seguridad

1. **APIs sin autenticación por sesión:** las rutas `/api/*` usan `service_role` y confían en `user_id` del query/body. Es diseño intencional para el formulario público, pero cualquier API en producción debería validar la sesión del usuario y que el `user_id` pertenezca a la sesión (riesgo de acceso horizontal). Los **límites de plan** sí se validan server-side (403), así que no se pueden evadir por UI.
2. **Los pedidos del formulario público no traen items**: el cliente solo ingresa datos de contacto y envío. La asociación con productos/ventas se hace en el dashboard (`ModalDetalle` busca ventas del cliente por DNI/teléfono y las vincula al envío con "Validar contenido").
3. **"Cobrar envío" en Copiar datos es solo local**: genera texto/Excel, no registra el cobro.
4. **Sincronización ventas**: cuando un envío pasa a `ENVIADO`, `sincronizarVentasEnviadas` marca `ventas.estado_envio='COMPLETADO'` vía `envio_id`.
5. **Directorios/vacíos**: `app/api/estadisticas/` está vacío (restos). No existe `/api/envios/[id]`.
6. **Estados de envío**: `NO_EMPACADO → EMPACADO → ENVIADO`. Crear el envío siempre inicia en `NO_EMPACADO`.

---

*Fin de la guía. Documento generado a partir del código fuente del repositorio `envios-pe-copy`.*
