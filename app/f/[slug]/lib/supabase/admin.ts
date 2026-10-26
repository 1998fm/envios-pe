import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseServiceKey, supabaseUrl } from '@/lib/supabaseEnv'

let _admin: SupabaseClient | null = null

function getAdminClient(): SupabaseClient {
  if (_admin) return _admin
  _admin = createClient(supabaseUrl(), supabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _admin
}

// Exportamos un proxy lazy (se evalúa en primer uso, no al importar)
export const supabaseAdmin = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_, prop) {
    return (getAdminClient() as any)[prop]
  },
})