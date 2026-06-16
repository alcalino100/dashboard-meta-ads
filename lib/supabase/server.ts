import { createClient } from "@supabase/supabase-js"

// Cliente server-side usando service role (apenas em Server Components / Route Handlers)
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key)
    throw new Error("Supabase server não configurado: verifique as variáveis de ambiente.")
  return createClient(url, key, { auth: { persistSession: false } })
}
