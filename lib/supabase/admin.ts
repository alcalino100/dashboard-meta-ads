import { createClient } from "@supabase/supabase-js"

// Cliente administrativo (service role) — SOMENTE no servidor.
// O app usa login próprio, então acessamos o banco via service role
// (RLS ligada sem políticas = cliente anônimo bloqueado).
let cached: ReturnType<typeof createClient> | null = null

export const SUPABASE_NOT_CONFIGURED =
  "Banco não configurado. Adicione SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente."

export function isSupabaseConfigured() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(url && key)
}

// Stub encadeável/thenable: qualquer método retorna a si mesmo e, ao await,
// resolve { data: null, error }. Evita crash quando o Supabase não está configurado.
function makeStub() {
  const result = { data: null, error: { message: SUPABASE_NOT_CONFIGURED } }
  const handler: ProxyHandler<() => void> = {
    get(_t, prop) {
      if (prop === "then") return (resolve: (v: typeof result) => unknown) => resolve(result)
      return () => proxy
    },
    apply() {
      return proxy
    },
  }
  const proxy: any = new Proxy(() => {}, handler)
  return proxy
}

export function supabaseAdmin() {
  if (cached) return cached
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return makeStub() as ReturnType<typeof createClient>
  cached = createClient(url, key, { auth: { persistSession: false } })
  return cached
}
