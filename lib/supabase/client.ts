import { createClient } from "@supabase/supabase-js"

let cached: ReturnType<typeof createClient> | null = null

export function supabaseBrowser() {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key)
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas."
    )
  cached = createClient(url, key)
  return cached
}
