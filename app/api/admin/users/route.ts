import { NextResponse } from "next/server"
import { supabaseAdmin, isSupabaseConfigured, SUPABASE_NOT_CONFIGURED } from "@/lib/supabase/admin"
import { getRequester, isAdmin } from "@/lib/admin-guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ROLES = ["Administrador", "Gestor", "Operador", "Somente leitura"]

const notConfigured = () => NextResponse.json({ error: SUPABASE_NOT_CONFIGURED }, { status: 503 })
const forbidden = () =>
  NextResponse.json({ error: "Apenas administradores podem gerenciar usuários." }, { status: 403 })

async function audit(actor: string, action: string, description: string) {
  try {
    await supabaseAdmin().from("audit_logs").insert({ actor, action, description })
  } catch {
    /* não bloqueia */
  }
}

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return notConfigured()
  const requester = await getRequester(req)
  if (!isAdmin(requester)) return forbidden()
  const { data, error } = await supabaseAdmin()
    .from("app_users")
    .select("id, name, email, role, account_ids, status, last_access, auth_id, created_at")
    .order("created_at", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) return notConfigured()
  const requester = await getRequester(req)
  if (!isAdmin(requester)) return forbidden()

  const body = await req.json()
  const name = (body.name as string)?.trim()
  const email = (body.email as string)?.trim().toLowerCase()
  const password = body.password as string
  const role = ROLES.includes(body.role) ? (body.role as string) : "Operador"
  const account_ids = Array.isArray(body.account_ids) ? (body.account_ids as string[]) : []

  if (!name) return NextResponse.json({ error: "Informe o nome." }, { status: 400 })
  if (!email || !email.includes("@")) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 })
  if (!password || password.length < 8)
    return NextResponse.json({ error: "A senha deve ter ao menos 8 caracteres." }, { status: 400 })

  const sb = supabaseAdmin()

  // 1. Cria credencial no Supabase Auth (já confirmada — login imediato)
  const { data: created, error: authErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  })
  if (authErr || !created.user) {
    const msg = /already been registered|exists/i.test(authErr?.message ?? "")
      ? "Já existe uma conta com este e-mail."
      : authErr?.message ?? "Falha ao criar credencial."
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // 2. Cria o registro de metadados vinculado ao auth_id
  const { data: row, error: rowErr } = await sb
    .from("app_users")
    .insert({ name, email, role, account_ids, status: "active", auth_id: created.user.id, last_access: null })
    .select()
    .single()

  if (rowErr) {
    // rollback da credencial para não deixar órfã
    await sb.auth.admin.deleteUser(created.user.id)
    const msg = /duplicate|unique/i.test(rowErr.message) ? "Já existe um usuário com este e-mail." : rowErr.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  await audit(requester!.email, "create", `Cadastrou usuário "${name}" (${role})`)
  return NextResponse.json({ item: row })
}

export async function PATCH(req: Request) {
  if (!isSupabaseConfigured()) return notConfigured()
  const requester = await getRequester(req)
  if (!isAdmin(requester)) return forbidden()

  const body = await req.json()
  const id = body.id as string
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  const sb = supabaseAdmin()
  const { data: target } = await sb.from("app_users").select("auth_id, role, status").eq("id", id).maybeSingle()
  const t = target as { auth_id: string | null; role: string; status: string } | null
  if (!t) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })

  // Impede que o admin remova o próprio acesso de administrador
  if (t.auth_id === requester!.authId && (body.role && body.role !== "Administrador" || body.status === "inactive")) {
    return NextResponse.json({ error: "Você não pode rebaixar ou desativar a própria conta." }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.name === "string") patch.name = body.name.trim()
  if (ROLES.includes(body.role)) patch.role = body.role
  if (body.status === "active" || body.status === "inactive") patch.status = body.status
  if (Array.isArray(body.account_ids)) patch.account_ids = body.account_ids

  const { data: row, error } = await sb.from("app_users").update(patch).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Nova senha opcional
  if (body.password && t.auth_id) {
    if ((body.password as string).length < 8)
      return NextResponse.json({ error: "A senha deve ter ao menos 8 caracteres." }, { status: 400 })
    await sb.auth.admin.updateUserById(t.auth_id, { password: body.password as string })
  }

  await audit(requester!.email, "update", `Atualizou usuário ${id}`)
  return NextResponse.json({ item: row })
}

export async function DELETE(req: Request) {
  if (!isSupabaseConfigured()) return notConfigured()
  const requester = await getRequester(req)
  if (!isAdmin(requester)) return forbidden()

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  const sb = supabaseAdmin()
  const { data: target } = await sb.from("app_users").select("auth_id").eq("id", id).maybeSingle()
  const t = target as { auth_id: string | null } | null
  if (t?.auth_id === requester!.authId)
    return NextResponse.json({ error: "Você não pode remover a própria conta." }, { status: 400 })

  const { error } = await sb.from("app_users").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (t?.auth_id) await sb.auth.admin.deleteUser(t.auth_id)

  await audit(requester!.email, "delete", `Removeu usuário ${id}`)
  return NextResponse.json({ ok: true })
}
