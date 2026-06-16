import { createClient } from "@supabase/supabase-js"

// Cliente administrativo (service role) — SOMENTE no servidor.
// O app usa login próprio, então acessamos o banco via service role
// (RLS ligada sem políticas = cliente anônimo bloqueado).
let cached: ReturnType<typeof createClient> | null = null

export function supabaseAdmin() {
  if (cached) return cached
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase service role não configurado")
  cached = createClient(url, key, { auth: { persistSession: false } })
  return cached
}
