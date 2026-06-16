"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type SessionState = "anonymous" | "authenticated" | "expired"

// Credencial de acesso padrão
export const DEFAULT_CREDENTIAL = {
  email: "garciaguilherme27@gmail.com",
  password: "Guilherme1412@",
  name: "Guilherme Garcia",
}

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

  const signIn = (email: string, password: string) => {
    if (
      email.trim().toLowerCase() !== DEFAULT_CREDENTIAL.email ||
      password !== DEFAULT_CREDENTIAL.password
    ) {
      return false
    }
    setUser({ name: DEFAULT_CREDENTIAL.name, email: DEFAULT_CREDENTIAL.email })
    setState("authenticated")
    return true
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
