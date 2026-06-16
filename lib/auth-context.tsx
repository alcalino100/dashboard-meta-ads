"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type SessionState = "anonymous" | "authenticated" | "expired"

// ⚠️  As credenciais de acesso são gerenciadas pelo Supabase Auth.
// NÃO adicione senhas ou emails fixos neste arquivo.
// Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local

type AuthCtx = {
  state: SessionState
  user: { name: string; email: string } | null
  signIn: (email: string, password: string) => boolean
  signOut: () => void
  expire: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>("anonymous")
  const [user, setUser] = useState<AuthCtx["user"]>(null)

  // Autenticação real deve ser feita via Supabase Auth (lib/supabase).
  // Este contexto é mantido apenas para compatibilidade com componentes existentes.
  const signIn = (_email: string, _password: string) => {
    // Integração real: use supabase.auth.signInWithPassword() na rota de login.
    console.warn("signIn stub chamado — implemente integração com Supabase Auth.")
    return false
  }

  const signOut = () => {
    setUser(null)
    setState("anonymous")
  }

  const expire = () => setState("expired")

  return <Ctx.Provider value={{ state, user, signIn, signOut, expire }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}
