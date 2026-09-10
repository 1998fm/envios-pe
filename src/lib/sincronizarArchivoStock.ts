import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'

// Sincroniza el flag `archivado` de un producto según su stock:
// stock 0 o negativo → archivado automático; stock > 0 → vuelve a activo.
export async function sincronizarArchivoPorStock(productoIds: string[]) {
  const ids = productoIds.filter(Boolean)
  if (ids.length === 0) return

  const { data } = await supabaseAdmin
    .from('productos')
    .select('id, stock_actual')
    .in('id', ids)

  if (!data) return

  const archivar = data.filter((p: any) => Number(p.stock_actual) <= 0).map((p: any) => p.id)
  const activar = data.filter((p: any) => Number(p.stock_actual) > 0).map((p: any) => p.id)

  const promises: PromiseLike<void>[] = []
  if (archivar.length > 0) {
    promises.push(
      supabaseAdmin
        .from('productos')
        .update({ archivado: true, updated_at: new Date().toISOString() })
        .in('id', archivar)
        .then(() => {})
    )
  }
  if (activar.length > 0) {
    promises.push(
      supabaseAdmin
        .from('productos')
        .update({ archivado: false, updated_at: new Date().toISOString() })
        .in('id', activar)
        .then(() => {})
    )
  }
  await Promise.all(promises)
}