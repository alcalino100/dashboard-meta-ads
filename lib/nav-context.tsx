"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { NavItem } from "@/lib/mock-data"

const NavCtx = createContext<(item: NavItem) => void>(() => {})

export function NavProvider({ navigate, children }: { navigate: (item: NavItem) => void; children: ReactNode }) {
  return <NavCtx.Provider value={navigate}>{children}</NavCtx.Provider>
}

export function useNavigate() {
  return useContext(NavCtx)
}
