"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type SessionState = "anonymous" | "authenticated" | "expired"

type AuthCtx = {
  state: SessionState
  user: { name: string; email: string } | null
  signIn: (email: string) => void
  signOut: () => void
  expire: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>("anonymous")
  const [user, setUser] = useState<AuthCtx["user"]>(null)

  const signIn = (email: string) => {
    setUser({ name: "Rafael Moreira", email })
    setState("authenticated")
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
