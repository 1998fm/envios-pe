import { registrarCambioManual } from '@/lib/billing/payments'
import { NextResponse } from "next/server";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { computeEffectivePlan } from "@/lib/planGating";
import { ESTADOS_ENVIO, sincronizarVentasEnviadas } from "@/lib/enviosServidor";
import { origenPublico } from "@/lib/authServidor";
import { mensajeDb } from "@/lib/erroresEs";
import type { SupportData } from "@/types/adminSupport";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROFILE =
  "id,empresa,slug,telefono,direccion,plan,trial_end,pro_until,disabled,role,cerrar_formulario,cerrar_formulario_mensaje,metodo_motorizado,metodo_shalom,metodo_olva,metodo_marvisur,metodo_flores,metodo_otro,metodo_recojo,origen_shalom,moto_region,logistica_moto_dias";
const ORDER =
  "id,codigo,nombre,telefono,dni,estado,metodo,destino,direccion,observaciones,fecha_programada,updated_at,fecha_registro";
const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);
  const { id } = await params;
  if (!UUID.test(id)) return fail("Identificador de empresa inválido");
  const url = new URL(request.url);
  const rawPage = Number(url.searchParams.get("pagina") ?? 1);
  const pagina =
    Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10000) : 1;
  const nombre = (url.searchParams.get("nombre") ?? "").trim().slice(0, 100);
  let query = supabaseAdmin
    .from("envios")
    .select(ORDER, { count: "exact" })
    .eq("user_id", id);
  if (nombre) query = query.ilike("nombre", `%${nombre.replace(/[%_]/g, "")}%`);
  const [profile, account, orders, history] = await Promise.all([
    supabaseAdmin.from("profiles").select(PROFILE).eq("id", id).maybeSingle(),
    supabaseAdmin.auth.admin.getUserById(id),
    query
      .order("fecha_registro", { ascending: false })
      .range((pagina - 1) * 25, pagina * 25 - 1),
    supabaseAdmin
      .from("admin_audit_log")
      .select("id,accion,admin_email,created_at,detalle")
      .contains("detalle", { empresaId: id })
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (profile.error) return fail(mensajeDb(profile.error), 500);
  if (!profile.data) return fail("Empresa no encontrada", 404);
  if (orders.error || history.error || account.error)
    return fail(
      "No se pudo completar el diagnóstico de la empresa. Intenta actualizar.",
      503,
    );
  const p = profile.data;
  const user = account.data.user;
  const plan = computeEffectivePlan(p);
  const bloqueada =
    !!user?.banned_until && new Date(user.banned_until).getTime() > Date.now();
  const diagnosticos: SupportData["diagnosticos"] = [];
  if (p.disabled || bloqueada)
    diagnosticos.push({
      codigo: "acceso",
      nivel: "error",
      titulo: "Acceso suspendido",
      detalle: p.disabled
        ? "La cuenta está desactivada. Puedes reactivarla en Acceso."
        : "El inicio de sesión está bloqueado. Revisa el acceso de la cuenta.",
    });
  if (p.cerrar_formulario)
    diagnosticos.push({
      codigo: "formulario",
      nivel: "aviso",
      titulo: "Formulario cerrado",
      detalle:
        "Los clientes no pueden registrar pedidos. Puedes abrirlo en Negocio y formulario.",
    });
  const methods = [
    "metodo_motorizado",
    "metodo_shalom",
    "metodo_olva",
    "metodo_marvisur",
    "metodo_flores",
    "metodo_otro",
    "metodo_recojo",
  ] as const;
  if (!methods.some((k) => p[k]))
    diagnosticos.push({
      codigo: "metodos",
      nivel: "error",
      titulo: "Sin métodos de entrega",
      detalle:
        "Activa al menos un método para que el cliente pueda completar su pedido.",
    });
  if (p.metodo_shalom && !p.origen_shalom)
    diagnosticos.push({
      codigo: "shalom",
      nivel: "aviso",
      titulo: "Falta el origen Shalom",
      detalle:
        "Revisa la agencia de origen en Negocio y formulario antes de exportar a Shalom.",
    });
  if (p.metodo_motorizado && !p.logistica_moto_dias?.length)
    diagnosticos.push({
      codigo: "dias",
      nivel: "aviso",
      titulo: "Motorizado sin días de atención",
      detalle: "Configura sus días de entrega en Negocio y formulario.",
    });
  if (
    plan.plan === "basic" &&
    p.pro_until &&
    new Date(p.pro_until) < new Date()
  )
    diagnosticos.push({
      codigo: "vigencia",
      nivel: "aviso",
      titulo: "Plus vencido",
      detalle:
        "El negocio funciona en Básico. Puedes revisar la facturación o conceder una extensión de acceso.",
    });
  if (!diagnosticos.length)
    diagnosticos.push({
      codigo: "ok",
      nivel: "ok",
      titulo: "Sin bloqueos detectados en esta revisión",
      detalle:
        "Cuenta, formulario y métodos de entrega no presentan las incidencias comprobadas por este diagnóstico.",
    });
  return NextResponse.json(
    {
      profile: p,
      cuenta: user
        ? {
            email: user.email ?? null,
            ultimoIngreso: user.last_sign_in_at ?? null,
            confirmado: !!user.email_confirmed_at,
            bloqueada,
          }
        : null,
      planEfectivo: plan,
      diagnosticos,
      pedidos: orders.data ?? [],
      totalPedidos: orders.count ?? 0,
      pagina,
      historial: history.data ?? [],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return fail(auth.error, auth.status);
  const { id } = await params;
  if (!UUID.test(id)) return fail("Identificador de empresa inválido");
  const body: unknown = await request.json().catch(() => null);
  if (
    !object(body) ||
    typeof body.motivo !== "string" ||
    body.motivo.trim().length < 10 ||
    body.motivo.length > 1000
  )
    return fail("Escribe un motivo de entre 10 y 1000 caracteres");
  if (!object(body.esperado))
    return fail(
      "Falta la versión de los datos que estás revisando. Actualiza la ficha.",
    );
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select(PROFILE)
    .eq("id", id)
    .maybeSingle();
  if (error) return fail(mensajeDb(error), 500);
  if (!profile) return fail("Empresa no encontrada", 404);
  let table = "profiles";
  let rowId = id;
  let before: Record<string, unknown> = profile;
  const changes: Record<string, unknown> = {};
  let password: string | undefined;
  let supportLink: string | undefined;
  if (body.accion === "configuracion") {
    if (!object(body.cambios) || !Object.keys(body.cambios).length)
      return fail("No hay cambios para guardar");
    const strings: Record<string, number> = {
      empresa: 80,
      slug: 80,
      telefono: 30,
      direccion: 300,
      origen_shalom: 300,
      cerrar_formulario_mensaje: 1000,
    };
    const bools = [
      "cerrar_formulario",
      "metodo_motorizado",
      "metodo_shalom",
      "metodo_olva",
      "metodo_marvisur",
      "metodo_flores",
      "metodo_otro",
      "metodo_recojo",
    ];
    for (const [k, v] of Object.entries(body.cambios)) {
      if (k === "logistica_moto_dias") {
        const allowed = [
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
          "SUNDAY",
        ];
        if (
          !Array.isArray(v) ||
          v.length > 7 ||
          !v.every((d) => typeof d === "string" && allowed.includes(d)) ||
          new Set(v).size !== v.length
        )
          return fail("Días de atención inválidos");
        changes[k] = v;
      } else if (Object.hasOwn(strings, k)) {
        if (typeof v !== "string" || v.length > strings[k])
          return fail(`Valor inválido para ${k}`);
        const value = v.trim();
        if (
          (k === "empresa" && !value) ||
          (k === "slug" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
        )
          return fail("Nombre o enlace del formulario inválido");
        changes[k] = value;
      } else if (bools.includes(k) && typeof v === "boolean") changes[k] = v;
      else
        return fail(`El campo ${k} no se puede modificar desde esta operación`);
    }
  } else if (body.accion === "extender_plus") {
    if (
      !Number.isSafeInteger(body.dias) ||
      Number(body.dias) < 1 ||
      Number(body.dias) > 365
    )
      return fail("La extensión debe ser de 1 a 365 días");
    const base = Math.max(
      Date.now(),
      new Date(profile.pro_until ?? 0).getTime() || 0,
      new Date(profile.trial_end ?? 0).getTime() || 0,
    );
    changes.plan = "business_plus";
    changes.pro_until = new Date(
      base + Number(body.dias) * 864e5,
    ).toISOString();
  } else if (body.accion === "pasar_basico") {
    // Conserva fechas y recibos como historial; el plan efectivo respeta basic.
    changes.plan = "basic";
  } else if (body.accion === "bloquear_cuenta") {
    if (typeof body.bloqueada !== "boolean")
      return fail("Estado de acceso inválido");
    if (id === auth.userId && body.bloqueada)
      return fail("No puedes suspender tu propia cuenta de administración");
    changes.disabled = body.bloqueada;
  } else if (body.accion === "reset_password" || body.accion === "impersonar") {
    if (id === auth.userId)
      return fail(
        "Usa la configuración de tu cuenta para gestionar tu propio acceso",
      );
  } else if (body.accion === "pedido") {
    if (
      typeof body.pedidoId !== "string" ||
      !UUID.test(body.pedidoId) ||
      !object(body.cambios) ||
      !Object.keys(body.cambios).length
    )
      return fail("Pedido o cambios inválidos");
    const found = await supabaseAdmin
      .from("envios")
      .select(ORDER)
      .eq("id", body.pedidoId)
      .eq("user_id", id)
      .maybeSingle();
    if (found.error) return fail(mensajeDb(found.error), 500);
    if (!found.data) return fail("El pedido no pertenece a esta empresa", 404);
    before = found.data;
    table = "envios";
    rowId = body.pedidoId;
    const text: Record<string, number> = {
      nombre: 150,
      telefono: 30,
      dni: 20,
      direccion: 500,
      destino: 150,
      observaciones: 1000,
    };
    for (const [k, v] of Object.entries(body.cambios)) {
      if (k === "estado" && typeof v === "string" && ESTADOS_ENVIO.includes(v))
        changes[k] = v;
      else if (
        k === "fecha_programada" &&
        typeof v === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !Number.isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v
      )
        changes[k] = v;
      else if (
        Object.hasOwn(text, k) &&
        typeof v === "string" &&
        v.length <= text[k]
      )
        changes[k] = v.trim();
      else return fail(`Valor inválido para ${k}`);
    }
  } else return fail("Operación de soporte no válida");

  const compare =
    body.accion === "reset_password" || body.accion === "impersonar"
      ? ["disabled", "role"]
      : body.accion === "extender_plus" || body.accion === "pasar_basico"
        ? ["plan", "trial_end", "pro_until"]
        : Object.keys(changes);
  for (const k of compare) {
    if (
      !(k in body.esperado) ||
      JSON.stringify(body.esperado[k]) !== JSON.stringify(before[k])
    )
      return fail(
        "Los datos cambiaron desde que abriste la ficha. Actualiza y revisa de nuevo.",
        409,
      );
  }
  // Auditar la intención es obligatorio: si falta la tabla no se hace la corrección.
  const record = {
    empresaId: id,
    registroId: rowId,
    motivo: body.motivo.trim(),
    estado: "pendiente",
    antes: Object.fromEntries(compare.map((k) => [k, before[k]])),
    cambios: changes,
  };
  const audit = await supabaseAdmin
    .from("admin_audit_log")
    .insert({
      admin_id: auth.userId,
      admin_email: auth.email,
      accion: `soporte_${body.accion}`,
      detalle: record,
    })
    .select("id")
    .single();
  if (audit.error || !audit.data)
    return fail(
      "No se pudo registrar la auditoría. No se aplicó ningún cambio.",
      503,
    );
  if (body.accion === "reset_password" || body.accion === "impersonar") {
    let authFailed = false;
    if (body.accion === "reset_password") {
      const bytes = new Uint8Array(18);
      crypto.getRandomValues(bytes);
      const alphabet =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
      password = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join(
        "",
      );
      const res = await supabaseAdmin.auth.admin.updateUserById(id, {
        password,
        email_confirm: true,
      });
      authFailed = !!res.error;
    } else {
      const account = await supabaseAdmin.auth.admin.getUserById(id);
      if (!account.data.user?.email || profile.disabled) authFailed = true;
      else {
        const origin = await origenPublico();
        const res = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: account.data.user.email,
          options: { redirectTo: `${origin}/dashboard` },
        });
        authFailed = !!res.error || !res.data.properties?.hashed_token;
        const hashedToken = res.data.properties?.hashed_token;
        if (hashedToken)
          supportLink = `${origin}/auth/impersonar?token_hash=${encodeURIComponent(hashedToken)}`;
      }
    }
    await supabaseAdmin
      .from("admin_audit_log")
      .update({
        detalle: { ...record, estado: authFailed ? "no_aplicado" : "aplicado" },
      })
      .eq("id", audit.data.id);
    if (authFailed)
      return fail(
        "No se pudo completar la operación de acceso. Revisa la cuenta e intenta de nuevo.",
        503,
      );
    return NextResponse.json(
      {
        ok: true,
        auditoriaId: audit.data.id,
        ...(password ? { password } : {}),
        ...(supportLink ? { link: supportLink } : {}),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  let update = supabaseAdmin.from(table).update(changes).eq("id", rowId);
  if (table === "envios") update = update.eq("user_id", id);
  // Comparación en la escritura: evita pisar ediciones concurrentes.
  for (const k of compare) {
    const value = before[k];
    if (value == null) update = update.is(k, null);
    else if (Array.isArray(value))
      update = update.eq(
        k,
        `{${value.map((v) => JSON.stringify(v)).join(",")}}`,
      );
    else update = update.eq(k, value);
  }
  const result = await update.select("id").maybeSingle();
  const success = !result.error && !!result.data;
  await supabaseAdmin
    .from("admin_audit_log")
    .update({
      detalle: { ...record, estado: success ? "aplicado" : "no_aplicado" },
    })
    .eq("id", audit.data.id);
  if (result.error)
    return fail(
      mensajeDb(result.error),
      result.error.code === "23505" ? 409 : 500,
    );
  if (!result.data)
    return fail(
      "La información se modificó durante la operación. Actualiza la ficha.",
      409,
    );
  if (body.accion === 'pasar_basico' || body.accion === 'extender_plus') {
    await registrarCambioManual(id, String(changes.plan), changes.pro_until as string | undefined)
  }
  if (body.accion === "bloquear_cuenta") {
    const res = await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: changes.disabled ? "876000h" : "none",
    });
    if (res.error)
      return NextResponse.json({
        ok: true,
        aviso:
          "El bloqueo del negocio se guardó, pero no se pudo sincronizar el inicio de sesión. Repite la operación para completar ambos estados.",
        auditoriaId: audit.data.id,
      });
  }
  if (table === "envios" && changes.estado === "ENVIADO")
    await sincronizarVentasEnviadas(id, [rowId]);
  return NextResponse.json({ ok: true, auditoriaId: audit.data.id });
}
