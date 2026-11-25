import {requireFunciones} from '@/lib/negocioAuth'
import { imagenEnUso } from "@/lib/productos/imagenes";
import { rutaDesdeUrlProducto } from "@/lib/comprimirImagen";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "app/f/[slug]/lib/supabase/admin";
import { requirePlus } from "@/lib/negocioAuth";
import { conImagenesProxy } from "@/lib/mediaUrl";
import { mensajeDb } from "@/lib/erroresEs";
import { UUID, validarFamilia } from "@/lib/productos/familias";
import type {
  VarianteProducto,
  FamiliaProducto,
} from "@/types/productosFamilias";
const falta = (e: { code?: string } | null) =>
  !!e && ["42P01", "PGRST200", "PGRST202", "PGRST205"].includes(e.code ?? "");
export async function GET(request: Request) {
  const auth = await requirePlus("ver_productos");
  if (!auth.ok) return auth.response;
  const permisoPlan=requireFunciones(auth,'productos_variantes');
  if(permisoPlan)return permisoPlan;
  const q = new URL(request.url).searchParams,
    id = q.get("id");
  if (id) {
    if (!UUID.test(id))
      return NextResponse.json(
        { error: "Producto no válido" },
        { status: 400 },
      );
    const f = await supabaseAdmin
      .from("productos_familias")
      .select("*")
      .eq("id", id)
      .eq("profile_id", auth.ownerId)
      .maybeSingle();
    if (f.error)
      return NextResponse.json(
        {
          error: falta(f.error)
            ? "Falta instalar la estructura de productos con variantes"
            : mensajeDb(f.error),
        },
        { status: 503 },
      );
    if (!f.data)
      return NextResponse.json(
        { error: "Producto principal no encontrado" },
        { status: 404 },
      );
    const campos =
      "id, profile_id, nombre, sku, descripcion, precio_venta, stock_actual, stock_minimo, unidad, imagen_url, archivado, created_at, updated_at" +
      (auth.permisos.ver_ganancia_producto ? ",precio_compra" : "");
    const v = await supabaseAdmin
      .from("producto_variantes")
      .select(`*,producto:productos(${campos})`)
      .eq("familia_id", id)
      .order("producto_id");
    if (v.error)
      return NextResponse.json({ error: mensajeDb(v.error) }, { status: 500 });
    return NextResponse.json({
      familia: conImagenesProxy(f.data, ["imagen_url"]),
      variantes: ((v.data as unknown as VarianteProducto[]) ?? [])
        .filter((x) => x.producto?.profile_id === auth.ownerId)
        .map((x) => ({
          ...x,
          producto: conImagenesProxy(x.producto, ["imagen_url"]),
        })),
    });
  }
  const offset = Math.max(0, Number(q.get("offset")) || 0),
    limit = 30;
  let query = supabaseAdmin
    .from("productos_familias")
    .select(
      "*,producto_variantes(producto_id,productos(stock_actual,precio_venta,archivado))",
      { count: "exact" },
    )
    .eq("profile_id", auth.ownerId)
    .order("nombre")
    .range(offset, offset + limit - 1);
  const busqueda = (q.get("busqueda") ?? "").trim().slice(0, 100);
  if (busqueda)
    query = query.ilike("nombre", `%${busqueda.replace(/[%_]/g, "")}%`);
  const r = await query;
  if (falta(r.error))
    return NextResponse.json({ habilitado: false, data: [], total: 0 });
  if (r.error)
    return NextResponse.json({ error: mensajeDb(r.error) }, { status: 500 });
  type ResumenFila = FamiliaProducto & {
    producto_variantes: {
      productos: {
        stock_actual: number;
        precio_venta: number;
        archivado: boolean;
      };
    }[];
  };
  const data = ((r.data as unknown as ResumenFila[]) ?? []).map((f) => {
    const { producto_variantes: vs, ...rest } = f;
    const productos = (vs ?? []).map((v) => v.productos).filter(Boolean);
    const precios = productos.map((p) => Number(p.precio_venta));
    return {
      ...conImagenesProxy(rest, ["imagen_url"]),
      cantidad: productos.length,
      stock: productos.reduce((s, p) => s + Number(p.stock_actual), 0),
      desde: precios.length ? Math.min(...precios) : Number(f.precio_base),
      hasta: precios.length ? Math.max(...precios) : Number(f.precio_base),
    };
  });
  return NextResponse.json({
    habilitado: true,
    data,
    total: r.count ?? 0,
    offset,
    limit,
  });
}
export async function POST(request: Request) {
  const auth = await requirePlus("ver_productos");
  if (!auth.ok) return auth.response;
  const permisoPlan=requireFunciones(auth,'productos_variantes');
  if(permisoPlan)return permisoPlan;
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 300000)
      return NextResponse.json(
        { error: "Operación demasiado grande" },
        { status: 413 },
      );
    body = validarFamilia(JSON.parse(raw), auth.permisos.ver_ganancia_producto);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Solicitud no válida" },
      { status: 400 },
    );
  }
  // Desactivar fotos conserva las ya guardadas; editar un precio no las elimina.
  if(requireFunciones(auth,'productos_fotos') && ['crear','guardar','agrupar'].includes(body.accion)) {
    const imagen='imagen_url' in body.datos?body.datos.imagen_url:null;
    const actual=body.id?await supabaseAdmin.from('productos_familias').select('imagen_url').eq('id',body.id).eq('profile_id',auth.ownerId).maybeSingle():null;
    if(actual?.error)return NextResponse.json({error:'No se pudo verificar la foto actual.'},{status:503});
    if((imagen??null)!==(actual?.data?.imagen_url??null))return requireFunciones(auth,'productos_fotos')!;
    const filas=body.variantes as Record<string,unknown>[];
    const ids=filas.flatMap(v=>typeof v.producto_id==='string'?[v.producto_id]:[]);
    const fotos=ids.length?await supabaseAdmin.from('productos').select('id,imagen_url').eq('profile_id',auth.ownerId).in('id',ids):null;
    if(fotos?.error)return NextResponse.json({error:'No se pudieron verificar las fotos actuales.'},{status:503});
    for(const v of filas){
      if('imagen_url' in v && (v.imagen_url??null)!==(fotos?.data?.find(p=>p.id===v.producto_id)?.imagen_url??null))return requireFunciones(auth,'productos_fotos')!;
      // Evita que cambiar la preferencia sustituya una foto especial por la general.
      delete v.imagen_especial;
    }
  }
  if(body.accion==='guardar' && requireFunciones(auth,'productos_archivar')){
    const filas=body.variantes as Record<string,unknown>[];
    const ids=filas.flatMap(v=>typeof v.producto_id==='string'?[v.producto_id]:[]);
    const actuales=ids.length?await supabaseAdmin.from('productos').select('id,archivado').eq('profile_id',auth.ownerId).in('id',ids):null;
    if(actuales?.error)return NextResponse.json({error:'No se pudo verificar el archivo de las variantes.'},{status:503});
    if(filas.some(v=>'archivado' in v && v.archivado!==(actuales?.data?.find(p=>p.id===v.producto_id)?.archivado??false)))return requireFunciones(auth,'productos_archivar')!;
  }
  if(body.accion==='guardar' && body.variantes.some(v=>!v.producto_id)){const crear=requireFunciones(auth,'productos_crear');if(crear)return crear;}
  const accionPlan=body.accion==='agrupar'?null:requireFunciones(auth,body.accion==='crear'?'productos_crear':'productos_editar');if(accionPlan)return accionPlan;
  const r = await supabaseAdmin.rpc("gestionar_producto_familia", {
    p_owner: auth.ownerId,
    p_accion: body.accion,
    p_familia: body.id,
    p_esperado: body.esperado,
    p_datos: body.datos,
    p_variantes: body.variantes,
  });
  if (r.error) {
    const missing = falta(r.error);
    const conflicto =
      ["23505", "40001", "40P01", "55P03"].includes(r.error.code ?? "") ||
      /cambió|otra ficha|ya está/i.test(r.error.message);
    return NextResponse.json(
      {
        error: missing
          ? "Falta instalar la estructura de productos con variantes"
          : mensajeDb(r.error),
      },
      { status: missing ? 503 : conflicto ? 409 : 400 },
    );
  }
  return NextResponse.json({ id: r.data });
}

export async function DELETE(request: Request) {
  const auth = await requirePlus("ver_productos");
  if (!auth.ok) return auth.response;
  const permisoPlan=requireFunciones(auth,'productos_variantes','productos_eliminar');
  if(permisoPlan)return permisoPlan;
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.id !== "string" ||
    !UUID.test(body.id) ||
    typeof body.esperado !== "string" ||
    !Number.isFinite(Date.parse(body.esperado)) ||
    body.confirmar !== true
  ) {
    return NextResponse.json(
      { error: "Confirma la eliminación desde una ficha actualizada" },
      { status: 400 },
    );
  }
  const actual = await supabaseAdmin
    .from("productos_familias")
    .select("id")
    .eq("id", body.id)
    .eq("profile_id", auth.ownerId)
    .maybeSingle();
  if (actual.error)
    return NextResponse.json(
      { error: mensajeDb(actual.error) },
      { status: 500 },
    );
  if (!actual.data)
    return NextResponse.json(
      { error: "Producto principal no encontrado" },
      { status: 404 },
    );
  const r = await supabaseAdmin.rpc("eliminar_producto_familia", {
    p_owner: auth.ownerId,
    p_familia: body.id,
    p_esperado: body.esperado,
  });
  if (r.error)
    return NextResponse.json(
      {
        error: falta(r.error)
          ? "Falta instalar la eliminación completa de productos con variantes. Contacta al administrador."
          : mensajeDb(r.error),
      },
      { status: falta(r.error) ? 503 : r.error.code === "40001" ? 409 : 400 },
    );
  // Las imágenes compartidas por otros productos nunca se borran.
  const resultado = r.data as { eliminados: number; imagenes: string[] };
  try {
    const rutas = await Promise.all(
      (resultado.imagenes ?? []).map(async (url) =>
        (await imagenEnUso(url)) ? null : rutaDesdeUrlProducto(url),
      ),
    );
    const libres = [...new Set(rutas.filter((ruta): ruta is string => !!ruta))];
    if (libres.length)
      await supabaseAdmin.storage.from("productos").remove(libres);
  } catch (e) {
    console.error("No se pudieron limpiar las fotos del producto eliminado", e);
  }
  return NextResponse.json({ success: true, eliminados: resultado.eliminados });
}
