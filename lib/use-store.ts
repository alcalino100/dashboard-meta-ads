"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { supabaseBrowser } from "@/lib/supabase/client"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Cabeçalhos autenticados: anexa o access token da sessão Supabase (para o
// servidor validar o papel/permissão de escrita do usuário).
async function authHeaders(json = true): Promise<Record<string, string>> {
  const h: Record<string, string> = {}
  if (json) h["Content-Type"] = "application/json"
  try {
    const { data } = await supabaseBrowser().auth.getSession()
    const token = data.session?.access_token
    if (token) h.authorization = `Bearer ${token}`
  } catch {
    /* sem sessão */
  }
  return h
}

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
  auth_id?: string | null
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

export type Client = {
  id: string
  name: string
  document: string | null
  email: string | null
  phone: string | null
  notes: string | null
  status: "active" | "inactive"
  created_at: string
}

export function useClients() {
  const { data, error, isLoading } = useSWR<{ items: Client[] }>("/api/store/clients", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 120_000,
  })
  return { clients: data?.items ?? [], error, isLoading }
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
  client_id: string | null
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

// Gestão de usuários (somente admin) — usa /api/admin/users com Bearer token.
const ADMIN_USERS_KEY = "/api/admin/users"

export function useAdminUsers(token: string | null) {
  const { data, error, isLoading } = useSWR<{ items: AppUser[] }>(
    token ? [ADMIN_USERS_KEY, token] : null,
    ([url, t]: [string, string]) =>
      fetch(url, { headers: { authorization: `Bearer ${t}` } }).then((r) => r.json()),
    { revalidateOnFocus: false },
  )
  return { users: data?.items ?? [], error, isLoading }
}

async function adminFetch(token: string, method: string, body?: Record<string, unknown>, query = "") {
  const res = await fetch(`${ADMIN_USERS_KEY}${query}`, {
    method,
    headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  await globalMutate((key) => Array.isArray(key) && key[0] === ADMIN_USERS_KEY, undefined, { revalidate: true })
  await globalMutate("/api/store/audit")
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? "Erro")
  return json
}

export function createUser(token: string, body: Record<string, unknown>) {
  return adminFetch(token, "POST", body)
}
export function updateUser(token: string, body: Record<string, unknown>) {
  return adminFetch(token, "PATCH", body)
}
export function deleteUser(token: string, id: string) {
  return adminFetch(token, "DELETE", undefined, `?id=${id}`)
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
    refreshInterval: 120_000,
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
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  await globalMutate(`/api/store/${entity}`)
  await globalMutate("/api/store/audit")
  if (!res.ok) throw new Error((await res.json()).error ?? "Erro")
  return res.json()
}

export async function deleteItem(entity: string, id: string) {
  const res = await fetch(`/api/store/${entity}?id=${id}`, { method: "DELETE", headers: await authHeaders(false) })
  await globalMutate(`/api/store/${entity}`)
  await globalMutate("/api/store/audit")
  if (!res.ok) throw new Error((await res.json()).error ?? "Erro")
  return res.json()
}

export async function patchItem(entity: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/store/${entity}`, {
    method: "PATCH",
    headers: await authHeaders(),
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
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  })
  await globalMutate("/api/settings")
  await globalMutate("/api/store/audit")
  if (!res.ok) throw new Error((await res.json()).error ?? "Erro")
  return res.json()
}
