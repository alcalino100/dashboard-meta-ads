"use client"

import useSWR from "swr"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error || "Falha na requisição")
  return json
}

// Presets no padrão Meta Ads Manager (+ custom:YYYY-MM-DD:YYYY-MM-DD)
export type Range = string

export type AdSetRow = {
  id: string
  name: string
  campaignId: string
  status: "active" | "paused" | "ended" | "review"
  spend: number
  impressions: number
  clicks: number
  cpc: number
  ctr: number
  messages: number
  costPerMsg: number
  budget: number
  optimization: string
  billing: string
  placements: string
  start: string
  end: string
}

export type AdRow = {
  id: string
  name: string
  adsetId: string
  campaignId: string
  status: "active" | "paused" | "ended" | "review"
  spend: number
  impressions: number
  clicks: number
  cpc: number
  ctr: number
  messages: number
  costPerMsg: number
  thumbnail: string | null
  title: string
  body: string
}

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

function acctParam(account?: string) {
  return account && account !== "all" ? `&account=${account}` : ""
}

export function useOverview(range: Range, account?: string) {
  return useSWR<OverviewData>(`/api/meta/overview?range=${range}${acctParam(account)}`, fetcher, {
    revalidateOnFocus: false,
  })
}

export function useCampaigns(range: Range, account?: string) {
  const key = `/api/meta/campaigns?range=${range}${acctParam(account)}`
  return useSWR<{ campaigns: CampaignRow[]; accounts: { id: string; name: string }[]; accountId?: string }>(
    key,
    fetcher,
    { revalidateOnFocus: false },
  )
}

export function useAdSets(range: Range, account?: string, campaign?: string, enabled = true) {
  const key = enabled
    ? `/api/meta/adsets?range=${range}${acctParam(account)}${campaign ? `&campaign=${campaign}` : ""}`
    : null
  return useSWR<{ adsets: AdSetRow[] }>(key, fetcher, { revalidateOnFocus: false })
}

export function useAds(range: Range, account?: string, adset?: string, enabled = true) {
  const key = enabled
    ? `/api/meta/ads?range=${range}${acctParam(account)}${adset ? `&adset=${adset}` : ""}`
    : null
  return useSWR<{ ads: AdRow[] }>(key, fetcher, { revalidateOnFocus: false })
}
