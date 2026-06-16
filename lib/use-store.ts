"use client"

import useSWR, { mutate as globalMutate } from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export type Goal = {
  id: string
  account_id: string | null
  account_name: string
  metric: string
  target: number
  current: number
  unit: string
  direction: "up" | "down"
}

export type AppUser = {
  id: string
  name: string
  email: string
  role: string
  account_ids: string[]
  status: "active" | "inactive"
  last_access: string | null
}

export type Rule = {
  id: string
  name: string
  metric: string
  operator: string
  threshold: number
  action: string
  scope: string
  active: boolean
}

export type AuditRow = {
  id: string
  actor: string
  actor_type?: string
  action: string
  description: string
  account: string | null
  ip: string | null
  created_at: string
}

export type ConnectionStatus =
  | "connected"
  | "token_expired"
  | "no_permission"
  | "sync_error"
  | "no_accounts"

export type Connection = {
  id: string
  name: string
  business_id: string | null
  app_id: string | null
  uses_env_token: boolean
  status: ConnectionStatus
  token_expires_at: string | null
  last_sync_at: string | null
  last_test_at: string | null
  created_at: string
}

export function useGoals() {
  const { data, error, isLoading } = useSWR<{ items: Goal[] }>("/api/store/goals", fetcher, {
    revalidateOnFocus: false,
  })
  return { goals: data?.items ?? [], error, isLoading }
}

export function useUsers() {
  const { data, error, isLoading } = useSWR<{ items: AppUser[] }>("/api/store/users", fetcher, {
    revalidateOnFocus: false,
  })
  return { users: data?.items ?? [], error, isLoading }
}

export function useRules() {
  const { data, error, isLoading } = useSWR<{ items: Rule[] }>("/api/store/rules", fetcher, {
    revalidateOnFocus: false,
  })
  return { rules: data?.items ?? [], error, isLoading }
}

export function useAudit() {
  const { data, error, isLoading } = useSWR<{ items: AuditRow[] }>("/api/store/audit", fetcher, {
    revalidateOnFocus: false,
  })
  return { logs: data?.items ?? [], error, isLoading }
}

export function useConnections() {
  const { data, error, isLoading } = useSWR<{ items: Connection[] }>("/api/store/connections", fetcher, {
    revalidateOnFocus: false,
  })
  return { connections: data?.items ?? [], error, isLoading }
}

export async function testConnection(id: string) {
  const res = await fetch("/api/meta/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  })
  await globalMutate("/api/store/connections")
  await globalMutate("/api/store/audit")
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? "Falha ao testar conexão")
  return json as { status: ConnectionStatus; detail: string; accountCount: number; permissions: string[] }
}

export function useSettings() {
  const { data, error, isLoading } = useSWR<{ settings: Record<string, unknown> }>("/api/settings", fetcher, {
    revalidateOnFocus: false,
  })
  return { settings: data?.settings ?? {}, error, isLoading }
}

// Helpers de mutação
export async function createItem(entity: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/store/${entity}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  await globalMutate(`/api/store/${entity}`)
  await globalMutate("/api/store/audit")
  if (!res.ok) throw new Error((await res.json()).error ?? "Erro")
  return res.json()
}

export async function deleteItem(entity: string, id: string) {
  const res = await fetch(`/api/store/${entity}?id=${id}`, { method: "DELETE" })
  await globalMutate(`/api/store/${entity}`)
  await globalMutate("/api/store/audit")
  if (!res.ok) throw new Error((await res.json()).error ?? "Erro")
  return res.json()
}

export async function patchItem(entity: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/store/${entity}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  await globalMutate(`/api/store/${entity}`)
  await globalMutate("/api/store/audit")
  if (!res.ok) throw new Error((await res.json()).error ?? "Erro")
  return res.json()
}

export async function saveSettings(payload: Record<string, unknown>) {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  await globalMutate("/api/settings")
  await globalMutate("/api/store/audit")
  if (!res.ok) throw new Error((await res.json()).error ?? "Erro")
  return res.json()
}
