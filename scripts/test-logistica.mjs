// Solo base efímera local: prueba la columna TIMESTAMPTZ y la DATE de producción.
import assert from "node:assert/strict";
import { startStack } from "./local-db/stack.mjs";
const stack = await startStack({ quiet: true });
const pool = stack.pool;
let checks = 0;
const eq = (a, b) => {
  assert.deepEqual(a, b);
  checks++;
};
async function owner(extra = {}) {
  const u = await stack.createUser({
    email: `logistica-${crypto.randomUUID()}@test.local`,
    password: "Demo1234!",
    confirmed: true,
  });
  await pool.query(
    `insert into profiles(id,empresa,slug,plan,pro_until,logistica_moto_dias,logistica_agencias_dias,logistica_moto_limitar,logistica_moto_cupo,logistica_agencias_limitar,logistica_agencias_cupo)
 values($1,'Prueba', $2,'business_plus','2099-01-01',array['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'],array['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'],true,1,true,1)`,
    [u.id, crypto.randomUUID()],
  );
  for (const [k, v] of Object.entries(extra))
    await pool.query(`update profiles set ${k}=$1 where id=$2`, [v, u.id]);
  return u.id;
}
async function rpc(name, args) {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(",");
  return (
    await pool.query(`select public.${name}(${placeholders}) as data`, args)
  ).rows[0].data;
}
function pedido(
  id,
  fecha = null,
  metodo = "MOTORIZADO",
  key = crypto.randomUUID(),
) {
  return {
    user_id: id,
    nombre: "Cliente de prueba",
    dni: String(Math.floor(1e7 + Math.random() * 8e7)),
    telefono: "999111222",
    metodo,
    detalle: "Prueba",
    fecha_programada: fecha,
    idempotency_key: key,
  };
}
try {
  for (const tipo of ["timestamptz", "date"]) {
    if (tipo === "date")
      await pool.query(
        `drop index envios_cupo_logistico; alter table envios alter column fecha_programada type date using public.tori_dia_logistica(fecha_programada); create index envios_cupo_logistico on envios(user_id,public.tori_dia_logistica(fecha_programada),metodo);`,
      );
    const id = await owner();
    const dias = (await rpc("tori_fechas_logistica", [id, "MOTORIZADO", 3]))
      .fechasDisponibles;
    const rr = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        rpc("tori_crear_envio_logistico", [pedido(id, dias[0])]),
      ),
    );
    eq(rr.filter((v) => v.status === "fulfilled").length, 1);
    eq(
      rr
        .filter((v) => v.status === "rejected")
        .every((v) => v.reason.message.includes("cupo")),
      true,
    );
    const primero = rr.find((v) => v.status === "fulfilled").value;
    eq(
      (await rpc("tori_fechas_logistica", [id, "MOTORIZADO", 3]))
        .fechasDisponibles[0],
      dias[1],
    );
    const shalom = await rpc("tori_crear_envio_logistico", [
      pedido(id, dias[0], "SHALOM"),
    ]);
    eq(
      (await rpc("tori_fechas_logistica", [id, "SHALOM", 3]))
        .fechasDisponibles[0],
      dias[1],
    );
    await assert.rejects(
      rpc("tori_crear_envio_logistico", [pedido(id, dias[0], "OLVA")]),
      /cupo/,
    );
    checks++;
    const autos = await Promise.all(
      Array.from({ length: 6 }, () =>
        rpc("tori_crear_envio_logistico", [pedido(id)]),
      ),
    );
    eq(
      new Set(autos.map((v) => String(v.fecha_programada).slice(0, 10))).size,
      6,
    );
    // No recontar el propio pedido al guardar su misma fecha.
    eq(
      (
        await rpc("tori_actualizar_envio_logistico", [
          id,
          primero.id,
          { fecha_programada: dias[0] },
        ])
      ).id,
      primero.id,
    );
    const otro = await owner();
    eq(
      await rpc("tori_actualizar_envio_logistico", [
        otro,
        primero.id,
        { fecha_programada: dias[2] },
      ]),
      null,
    );
    // Una reprogramación no puede ocupar el cupo reservado por otro.
    await assert.rejects(
      rpc("tori_actualizar_envio_logistico", [
        id,
        primero.id,
        { fecha_programada: String(autos[0].fecha_programada) },
      ]),
      /cupo/,
    );
    checks++;
    await assert.rejects(
      rpc("tori_actualizar_envio_logistico", [
        id,
        shalom.id,
        { fecha_programada: dias[2] },
        { estado: "ENVIADO" },
      ]),
      /cambió/,
    );
    checks++;
    const idempotente = await owner();
    const payload = pedido(idempotente);
    const iguales = await Promise.all(
      Array.from({ length: 6 }, () =>
        rpc("tori_crear_envio_logistico", [payload]),
      ),
    );
    eq(new Set(iguales.map((v) => v.id)).size, 1);
    // DATE real: la comparación no usa dos extremos que se conviertan al mismo día.
    const c = await pool.query(
      "select count(*)::int as n from envios where user_id=$1 and public.tori_dia_logistica(fecha_programada)=$2::date and metodo=$3",
      [id, dias[0], "MOTORIZADO"],
    );
    eq(c.rows[0].n, 1);
    // Cambio de reglas tras abrir el formulario: la fecha anterior deja de admitirse.
    const nuevo = await owner({ logistica_moto_anticipacion: 4 });
    await assert.rejects(
      rpc("tori_crear_envio_logistico", [pedido(nuevo, dias[0])]),
      /anticipación/,
    );
    checks++;
    const calendario = await owner({
      logistica_moto_dias: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
      ],
      logistica_moto_anticipacion: 2,
    });
    eq(
      (
        await rpc("tori_reglas_logistica", [
          calendario,
          "MOTORIZADO",
          "2026-11-20T15:00:00-05:00",
        ])
      ).minima,
      "2026-11-23",
    );
    await pool.query(
      "update profiles set logistica_moto_anticipacion_solo_habiles=true,logistica_moto_usa_hora_corte=true,logistica_moto_hora_corte=$1 where id=$2",
      ["16:00", calendario],
    );
    eq(
      (
        await rpc("tori_reglas_logistica", [
          calendario,
          "MOTORIZADO",
          "2026-11-20T15:00:00-05:00",
        ])
      ).minima,
      "2026-11-24",
    );
    eq(
      (
        await rpc("tori_reglas_logistica", [
          calendario,
          "MOTORIZADO",
          "2026-11-20T16:00:00-05:00",
        ])
      ).minima,
      "2026-11-25",
    );
    const peru = await owner();
    eq(
      (
        await rpc("tori_reglas_logistica", [
          peru,
          "MOTORIZADO",
          "2026-11-21T03:00:00Z",
        ])
      ).minima,
      "2026-11-21",
    );
    const basico = await owner({
      plan: "basic",
      logistica_moto_anticipacion: 6,
    });
    const regla = await rpc("tori_reglas_logistica", [
      basico,
      "MOTORIZADO",
      "2026-11-20T15:00:00-05:00",
    ]);
    eq([regla.minima, regla.limitar, regla.plus], ["2026-11-21", false, false]);
    const sinCupo = await owner({ logistica_moto_cupo: 0 });
    await assert.rejects(
      rpc("tori_fechas_logistica", [sinCupo, "MOTORIZADO", 3]),
      /mayor que cero/,
    );
    checks++;
    const sinDias = await owner({ logistica_moto_dias: [] });
    await assert.rejects(
      rpc("tori_fechas_logistica", [sinDias, "MOTORIZADO", 3]),
      /días de atención/,
    );
    checks++;
    console.log(
      `${tipo}: calendario, reservas concurrentes, cuotas separadas, reprogramación e idempotencia OK`,
    );
  }
  console.log(`${checks} comprobaciones SQL completadas en base local.`);
} finally {
  await stack.stop();
}
