"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { supabaseBrowser } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

type SessionState = "anonymous" | "authenticated" | "expired" | "loading"

export type Role = "Administrador" | "Gestor" | "Operador" | "Somente leitura"

// Hierarquia de papéis: quanto maior, mais permissões.
const ROLE_LEVEL: Record<Role, number> = {
  "Somente leitura": 0,
  Operador: 1,
  Gestor: 2,
  Administrador: 3,
}

type AuthCtx = {
  state: SessionState
  user: { name: string; email: string } | null
  role: Role | null
  isAdmin: boolean
  canWrite: boolean
  getToken: () => Promise<string | null>
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  expire: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

function toUser(u: User | null): AuthCtx["user"] {
  if (!u) return null
  return {
    name:
      (u.user_metadata?.full_name as string | undefined) ??
      u.email?.split("@")[0] ??
      "Usuário",
    email: u.email ?? "",
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>("loading")
  const [user, setUser] = useState<AuthCtx["user"]>(null)
  const [role, setRole] = useState<Role | null>(null)

  const getToken = useCallback(async () => {
    const sb = supabaseBrowser()
    const { data } = await sb.auth.getSession()
    return data.session?.access_token ?? null
  }, [])

  // Busca o papel real do usuário (app_users) após autenticar
  const fetchRole = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return setRole(null)
      const res = await fetch("/api/me", { headers: { authorization: `Bearer ${token}` } })
      const json = await res.json()
      setRole((json.role as Role | null) ?? null)
    } catch {
      setRole(null)
    }
  }, [getToken])

  useEffect(() => {
    const sb = supabaseBrowser()

    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(toUser(data.session.user))
        setState("authenticated")
        fetchRole()
      } else {
        setState("anonymous")
      }
    })

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(toUser(session.user))
        setState("authenticated")
        fetchRole()
      } else {
        setUser(null)
        setRole(null)
        setState((prev) => (prev === "authenticated" ? "anonymous" : prev))
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchRole])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    const sb = supabaseBrowser()
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) {
      console.error("signIn error:", error.message)
      return false
    }
    return true
  }

  const signOut = async () => {
    const sb = supabaseBrowser()
    await sb.auth.signOut()
    setUser(null)
    setRole(null)
    setState("anonymous")
  }

  const expire = () => setState("expired")

  const isAdmin = role === "Administrador"
  const canWrite = role != null && ROLE_LEVEL[role] >= ROLE_LEVEL["Operador"]

  return (
    <Ctx.Provider value={{ state, user, role, isAdmin, canWrite, getToken, signIn, signOut, expire }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}
