"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabaseBrowser } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

type SessionState = "anonymous" | "authenticated" | "expired" | "loading"

type AuthCtx = {
  state: SessionState
  user: { name: string; email: string } | null
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  expire: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

function toUser(u: User | null): AuthCtx["user"] {
  if (!u) return null
  return {
    name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "Usuário",
    email: u.email ?? "",
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>("loading")
  const [user, setUser] = useState<AuthCtx["user"]>(null)
  const sb = supabaseBrowser()

  useEffect(() => {
    // Restore existing session on mount
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(toUser(data.session.user))
        setState("authenticated")
      } else {
        setState("anonymous")
      }
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(toUser(session.user))
        setState("authenticated")
      } else {
        setUser(null)
        setState("anonymous")
      }
    })

    return () => subscription.unsubscribe()
  }, [sb])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) {
      console.error("signIn error:", error.message)
      return false
    }
    return true
  }

  const signOut = async () => {
    await sb.auth.signOut()
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
