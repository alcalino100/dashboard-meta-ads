"use client"

import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useStatus, useAccounts, type StatusData, type AccountData } from "@/lib/use-meta"

// Presets de período no padrão Meta Ads Manager
export const DATE_PRESETS: { value: string; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last_7d", label: "Últimos 7 dias" },
  { value: "last_14d", label: "Últimos 14 dias" },
  { value: "last_30d", label: "Últimos 30 dias" },
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês passado" },
  { value: "maximum", label: "Máximo" },
]

export function presetLabel(value: string): string {
  if (value.startsWith("custom:")) {
    const [, since, until] = value.split(":")
    const f = (d: string) => d?.split("-").reverse().join("/")
    return `${f(since)} – ${f(until)}`
  }
  return DATE_PRESETS.find((p) => p.value === value)?.label ?? "Personalizado"
}

type FiltersCtx = {
  range: string
  account: string // "all" ou id da conta
  compare: boolean
  setRange: (r: string) => void
  setAccount: (a: string) => void
  setCompare: (c: boolean) => void
  // fonte única de conexão + contas
  status?: StatusData
  statusLoading: boolean
  connected: boolean
  accounts: AccountData[]
  accountsLoading: boolean
  accountName: (id: string) => string
}

const Ctx = createContext<FiltersCtx | null>(null)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const range = params.get("range") ?? "last_30d"
  const account = params.get("acct") ?? "all"
  const compare = params.get("cmp") === "1"

  const { data: status, isLoading: statusLoading } = useStatus()
  const { data: accountsData, isLoading: accountsLoading } = useAccounts()
  const accounts = accountsData?.accounts ?? []

  const update = useCallback(
    (next: Record<string, string | null>) => {
      const sp = new URLSearchParams(params.toString())
      for (const [k, v] of Object.entries(next)) {
        if (v === null || v === "") sp.delete(k)
        else sp.set(k, v)
      }
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
    },
    [params, pathname, router],
  )

  const value = useMemo<FiltersCtx>(
    () => ({
      range,
      account,
      compare,
      setRange: (r) => update({ range: r }),
      setAccount: (a) => update({ acct: a === "all" ? null : a }),
      setCompare: (c) => update({ cmp: c ? "1" : null }),
      status,
      statusLoading,
      connected: !!status?.connected,
      accounts,
      accountsLoading,
      accountName: (id) => accounts.find((a) => a.id === id)?.name ?? id,
    }),
    [range, account, compare, update, status, statusLoading, accounts, accountsLoading],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useFilters() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useFilters precisa estar dentro de FiltersProvider")
  return ctx
}
