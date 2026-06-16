import { NextResponse } from "next/server"
import { supabaseAdmin, isSupabaseConfigured, SUPABASE_NOT_CONFIGURED } from "@/lib/supabase/admin"

const notConfigured = () => NextResponse.json({ error: SUPABASE_NOT_CONFIGURED }, { status: 503 })

// Whitelist de tabelas e colunas graváveis (segurança)
const TABLES: Record<string, { table: string; cols: string[]; order?: string }> = {
  goals: {
    table: "goals",
    cols: ["account_id", "account_name", "metric", "target", "current", "unit", "direction"],
    order: "created_at",
  },
  users: {
    table: "app_users",
    cols: ["name", "email", "role", "account_ids", "status", "last_access"],
    order: "created_at",
  },
  rules: {
    table: "rules",
    cols: ["connection_id", "name", "metric", "operator", "threshold", "action", "scope", "active"],
    order: "created_at",
  },
  connections: {
    table: "connections",
    cols: ["name", "business_id", "app_id", "access_token", "status"],
    order: "created_at",
  },
  audit: { table: "audit_logs", cols: ["actor", "action", "description", "account", "ip"], order: "created_at" },
}

function pick(body: Record<string, unknown>, cols: string[]) {
  const out: Record<string, unknown> = {}
  for (const c of cols) if (c in body) out[c] = body[c]
  return out
}

async function log(action: string, description: string) {
  try {
    await supabaseAdmin().from("audit_logs").insert({ actor: "Você", action, description })
  } catch {
    /* não bloqueia a operação principal */
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ entity: string }> }) {
  if (!isSupabaseConfigured()) return notConfigured()
  const { entity } = await params
  const cfg = TABLES[entity]
  if (!cfg) return NextResponse.json({ error: "Entidade inválida" }, { status: 400 })
  const { data, error } = await supabaseAdmin()
    .from(cfg.table)
    .select("*")
    .order(cfg.order ?? "created_at", { ascending: entity !== "audit" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}

export async function POST(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  if (!isSupabaseConfigured()) return notConfigured()
  const { entity } = await params
  const cfg = TABLES[entity]
  if (!cfg || entity === "audit") return NextResponse.json({ error: "Entidade inválida" }, { status: 400 })
  const body = await req.json()
  const row = pick(body, cfg.cols)
  const { data, error } = await supabaseAdmin().from(cfg.table).insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await log("create", `Criou ${entity} "${(row.name ?? row.account_name ?? row.email ?? "") as string}"`)
  return NextResponse.json({ item: data })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  if (!isSupabaseConfigured()) return notConfigured()
  const { entity } = await params
  const cfg = TABLES[entity]
  if (!cfg || entity === "audit") return NextResponse.json({ error: "Entidade inválida" }, { status: 400 })
  const body = await req.json()
  const id = body.id as string
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })
  const row = pick(body, cfg.cols)
  const { data, error } = await supabaseAdmin().from(cfg.table).update(row).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await log("update", `Atualizou ${entity} ${id}`)
  return NextResponse.json({ item: data })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  if (!isSupabaseConfigured()) return notConfigured()
  const { entity } = await params
  const cfg = TABLES[entity]
  if (!cfg || entity === "audit") return NextResponse.json({ error: "Entidade inválida" }, { status: 400 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })
  if (entity === "connections") {
    const { data: conn } = await supabaseAdmin()
      .from("connections")
      .select("uses_env_token")
      .eq("id", id)
      .maybeSingle()
    if (conn?.uses_env_token) {
      return NextResponse.json(
        { error: "A conexão principal (token do ambiente) não pode ser removida." },
        { status: 400 },
      )
    }
  }
  const { error } = await supabaseAdmin().from(cfg.table).delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await log("delete", `Removeu ${entity} ${id}`)
  return NextResponse.json({ ok: true })
}
