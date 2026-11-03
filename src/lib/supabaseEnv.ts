// Configuración de Supabase SOLO para código de servidor (rutas API, proxy,
// páginas de servidor). Ningún componente de navegador debe importar este
// módulo: la URL y las llaves de la base no viajan al cliente. Hay un e2e
// (e2e/no-leaks.spec.ts) que revisa el JavaScript publicado y falla si
// aparecen.
//
// Se leen primero las variables privadas (SUPABASE_URL, SUPABASE_ANON_KEY) y,
// por compatibilidad con despliegues existentes, las NEXT_PUBLIC_* antiguas.
// Cuando las NEXT_PUBLIC_* ya no estén en el hosting se pueden borrar.

export function supabaseUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('Falta SUPABASE_URL')
  return url
}

export function supabaseAnonKey(): string {
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!key) throw new Error('Falta SUPABASE_ANON_KEY')
  return key
}

export function supabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY')
  return key
}
