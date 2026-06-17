import "server-only"
import { supabaseAdmin } from "@/lib/supabase/admin"

export type AuthedUser = {
  authId: string
  email: string
  role: string
  appUserId: string
}

/**
 * Valida o Bearer token (access token do Supabase) enviado pelo cliente e
 * resolve o registro correspondente em app_users. Retorna null se inválido.
 */
export async function getRequester(req: Request): Promise<AuthedUser | null> {
  const header = req.headers.get("authorization") ?? ""
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7) : ""
  if (!token) return null

  const sb = supabaseAdmin()
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user) return null

  const authId = data.user.id
  const { data: row } = await sb
    .from("app_users")
    .select("id, email, role, status")
    .eq("auth_id", authId)
    .maybeSingle()

  const r = row as { id: string; email: string; role: string; status: string } | null
  if (!r || r.status !== "active") return null

  return { authId, email: r.email, role: r.role, appUserId: r.id }
}

export function isAdmin(user: AuthedUser | null): boolean {
  return user?.role === "Administrador"
}
