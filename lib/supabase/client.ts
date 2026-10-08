import { createClient } from "@supabase/supabase-js"

type BrowserClient = ReturnType<typeof createClient>

let cached: BrowserClient | null = null

export function isSupabaseBrowserConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Stub seguro quando o Supabase não está configurado (ex: .env.local incompleto
// ou vars ausentes na Vercel). Imita o suficiente do auth para a UI cair no
// estado "anonymous" + SetupBanner em vez de quebrar a página inteira.
function makeAuthStub(): BrowserClient {
  const noSession = { data: { session: null }, error: null }
  const stub = {
    auth: {
      getSession: async () => noSession,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: { session: null, user: null }, error: { message: "Supabase não configurado" } }),
      signOut: async () => ({ error: null }),
    },
  }
  return stub as unknown as BrowserClient
}

export function supabaseBrowser() {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes — usando stub (login desabilitado)."
      )
    }
    cached = makeAuthStub()
    return cached
  }
  cached = createClient(url, key)
  return cached
}
