"use client"

import useSWR from "swr"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error || "Falha na requisição")
  return json
}

export type Range = "last_7d" | "last_30d"

export type StatusData = {
  connected: boolean
  user?: { id: string; name: string }
  appId?: string | null
  permissions?: string[]
  accountCount?: number
  error?: string
}

export type AccountData = {
  id: string
  accountId: string
  name: string
  currency: string
  status: number
  amountSpent: number
}

export type Totals = {
  spend: number
  impressions: number
  clicks: number
  linkClicks: number
  cpc: number
  cpm: number
  ctr: number
  reach: number
  messages: number
  costPerMsg: number
}

export type OverviewData = {
  totals: Totals
  accountShare: { name: string; gasto: number; mensagens: number }[]
  trend: { date: string; gasto: number; cliques: number; mensagens: number; custoMsg: number }[]
  accountsConsidered: number
}

export type CampaignRow = {
  id: string
  name: string
  account: string
  objective: string
  status: "active" | "paused" | "ended" | "review"
  spend: number
  impressions: number
  clicks: number
  cpc: number
  ctr: number
  messages: number
  costPerMsg: number
  budget: number
  start: string
  end: string
  updated: string
}

export function useStatus() {
  return useSWR<StatusData>("/api/meta/status", fetcher, { revalidateOnFocus: false })
}

export function useAccounts() {
  return useSWR<{ accounts: AccountData[] }>("/api/meta/accounts", fetcher, { revalidateOnFocus: false })
}

export function useOverview(range: Range) {
  return useSWR<OverviewData>(`/api/meta/overview?range=${range}`, fetcher, { revalidateOnFocus: false })
}

export function useCampaigns(range: Range, account?: string) {
  const key = `/api/meta/campaigns?range=${range}${account ? `&account=${account}` : ""}`
  return useSWR<{ campaigns: CampaignRow[]; accounts: { id: string; name: string }[]; accountId?: string }>(
    key,
    fetcher,
    { revalidateOnFocus: false },
  )
}
