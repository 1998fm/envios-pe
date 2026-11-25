// Base efímera exclusivamente. Nunca utiliza credenciales de producción.
import assert from "node:assert/strict";
import { startStack } from "./local-db/stack.mjs";
const stack = await startStack({ quiet: true }),
  db = stack.pool;
let checks = 0;
const eq = (a, b) => {
  assert.deepEqual(a, b);
  checks++;
};
async function cuenta(plan = "basic", admin = false) {
  const u = await stack.createUser({
    email: `planes-${crypto.randomUUID()}@test.local`,
    password: "Demo1234!",
    confirmed: true,
  });
  await db.query(
    "insert into profiles(id,empresa,slug,plan,pro_until,role,logistica_moto_dias,logistica_agencias_dias) values($1,'Prueba',$2,$3,'2099-01-01',$4,array['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'],array['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'])",
    [u.id, crypto.randomUUID(), plan, admin ? "super_admin" : "user"],
  );
  return u.id;
}
async function planes() {
  return Object.fromEntries(
    (
      await db.query(
        "select plan,permisos,revision,max_envios,max_metodos,max_productos,max_ventas,max_exportaciones_shalom,max_pedidos_copiar,max_miembros from plan_features where plan in ('basic','business_plus')",
      )
    ).rows.map((p) => [p.plan, p]),
  );
}
async function publicar(actor, ps) {
  await db.query("select tori_publicar_planes($1,null,$2)", [actor, ps]);
}
async function permite(plan, key) {
  return (await db.query("select tori_plan_permite($1,$2) as si", [plan, key]))
    .rows[0].si;
}
try {
  const admin = await cuenta("business_plus", true),
    basic = await cuenta(),
    plus = await cuenta("business_plus");
  const originales = await planes(),
    perfiles = (
      await db.query(
        "select id,plan,pro_until,trial_end from profiles order by id",
      )
    ).rows;
  eq(await permite("basic", "productos_crear"), false);
  eq(await permite("pro", "productos_crear"), true);
  eq(await permite("basic", "formulario"), true);
  let ps = structuredClone(originales);
  ps.basic.permisos.productos = true;
  ps.basic.max_productos = 1;
  ps.basic.max_envios = 1;
  ps.basic.permisos.logistica_anticipacion = true;
  ps.business_plus.max_ventas = 1;
  ps.business_plus.max_exportaciones_shalom = 1;
  ps.business_plus.max_miembros = 1;
  await assert.rejects(publicar(basic, ps), /Acceso restringido/);
  checks++;
  await publicar(admin, ps);
  eq(await permite("basic", "productos_crear"), true);
  eq(
    (
      await db.query(
        "select id,plan,pro_until,trial_end from profiles order by id",
      )
    ).rows,
    perfiles,
  );
  await assert.rejects(publicar(admin, ps), /Los planes cambiaron/);
  checks++;
  eq(
    (
      await db.query(
        "select count(*)::int as n from admin_audit_log where accion='editar_planes'",
      )
    ).rows[0].n,
    1,
  );
  const antes = await planes(),
    invalido = structuredClone(antes);
  invalido.basic.max_envios = 4;
  invalido.business_plus.max_ventas = -1;
  await assert.rejects(publicar(admin, invalido), /Límite no válido/);
  checks++;
  eq(await planes(), antes); // Incluso si el primer plan se actualizó antes del error, todo revierte.
  const products = await Promise.allSettled(
    Array.from({ length: 8 }, () =>
      db.query(
        "insert into productos(profile_id,nombre,stock_actual) values($1,'Prueba concurrente',1)",
        [basic],
      ),
    ),
  );
  eq(products.filter((r) => r.status === "fulfilled").length, 1);
  eq(
    (
      await db.query(
        "select count(*)::int as n from productos where profile_id=$1",
        [basic],
      )
    ).rows[0].n,
    1,
  );
  const persona = (
    await db.query(
      "insert into personas(nombre,dni) values('Prueba','12345678') returning id",
    )
  ).rows[0].id;
  const ventas = await Promise.allSettled(
    Array.from({ length: 8 }, () =>
      db.query(
        "insert into ventas(profile_id,persona_id,persona_nombre,persona_dni,total) values($1,$2,'Prueba','12345678',25.50)",
        [plus, persona],
      ),
    ),
  );
  eq(ventas.filter((r) => r.status === "fulfilled").length, 1);
  const exports = await Promise.allSettled(
    Array.from({ length: 8 }, () =>
      db.query("select tori_registrar_exportacion($1,1)", [plus]),
    ),
  );
  eq(exports.filter((r) => r.status === "fulfilled").length, 1);
  const rol = (
    await db.query(
      "insert into business_roles(owner_id,nombre,permisos) values($1,'Operador','{}') returning id",
      [plus],
    )
  ).rows[0].id;
  const miembros = await Promise.all(Array.from({ length: 5 }, () => cuenta()));
  const equipo = await Promise.allSettled(
    miembros.map((u) =>
      db.query(
        "insert into business_members(owner_id,user_id,role_id) values($1,$2,$3)",
        [plus, u, rol],
      ),
    ),
  );
  eq(equipo.filter((r) => r.status === "fulfilled").length, 1);
  const pedidos = await Promise.allSettled(
    Array.from({ length: 8 }, () =>
      db.query("select tori_crear_envio_logistico($1)", [
        {
          user_id: basic,
          nombre: "Pedido",
          telefono: "999111222",
          metodo: "MOTORIZADO",
          idempotency_key: crypto.randomUUID(),
        },
      ]),
    ),
  );
  eq(pedidos.filter((r) => r.status === "fulfilled").length, 1);
  await db.query(
    "update profiles set logistica_moto_anticipacion=4,logistica_moto_limitar=true,logistica_moto_cupo=1 where id=$1",
    [basic],
  );
  const regla = (
    await db.query(
      "select tori_reglas_logistica($1,'MOTORIZADO','2026-11-25T17:00:00Z') as r",
      [basic],
    )
  ).rows[0].r;
  eq(regla.minima, "2026-11-29");
  eq(regla.limitar, false); // Una función permitida no habilita las demás.
  ps = await planes();
  ps.basic.permisos.configuracion = false;
  await publicar(admin, ps);
  eq(await permite("basic", "logistica_anticipacion"), false);
  eq(
    (
      await db.query(
        "select tori_reglas_logistica($1,'MOTORIZADO','2026-11-25T17:00:00Z') as r",
        [basic],
      )
    ).rows[0].r.minima,
    "2026-11-26",
  );
  ps = await planes();
  ps.basic.max_envios = null;
  ps.basic.max_productos = null;
  await publicar(admin, ps);
  await db.query(
    "insert into productos(profile_id,nombre,stock_actual) values($1,'Sin límite',1)",
    [basic],
  );
  checks++;
  for (const role of ["anon", "authenticated"]) {
    const c = await db.connect();
    try {
      await c.query("begin");
      await c.query(`set local role ${role}`);
      await assert.rejects(
        c.query("select tori_publicar_planes($1,null,$2)", [
          admin,
          await planes(),
        ]),
        /permission denied/,
      );
      checks++;
    } finally {
      await c.query("rollback");
      c.release();
    }
  }
  const audit = (
    await db.query(
      "select detalle from admin_audit_log where accion='editar_planes' order by id limit 1",
    )
  ).rows[0].detalle;
  eq(audit.antes.length, 2);
  eq(audit.despues.basic.permisos.productos, true);
  console.log(
    `${checks} comprobaciones de planes: permisos, publicación, auditoría, datos conservados y límites concurrentes OK.`,
  );
} finally {
  await stack.stop();
}
