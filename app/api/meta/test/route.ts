import { NextResponse } from "next/server"
import { getMe, getPermissions, getAdAccounts, MetaApiError } from "@/lib/meta-api"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const REQUIRED_SCOPES = ["ads_read", "ads_management", "business_management"]

// Testa/verifica uma conexão e persiste o resultado no banco.
// Estados: connected | token_expired | no_permission | sync_error | no_accounts
export async function POST(req: Request) {
  const { id } = await req.json().catch(() => ({}) as { id?: string })
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  const db = supabaseAdmin()
  const { data: conn } = await db.from("connections").select("*").eq("id", id).maybeSingle()
  if (!conn) return NextResponse.json({ error: "Conexão não encontrada" }, { status: 404 })

  let status = "connected"
  let detail = "Conexão saudável"
  let accountCount = 0
  let permissions: string[] = []
  let userName: string | null = null

  // Apenas a conexão do token de ambiente é validada de fato contra a Meta.
  if (conn.uses_env_token) {
    try {
      const [me, perms, accounts] = await Promise.all([getMe(), getPermissions(), getAdAccounts()])
      userName = me?.name ?? null
      permissions = perms
      accountCount = accounts.length
      const missing = REQUIRED_SCOPES.filter((s) => !perms.includes(s))
      if (missing.length) {
        status = "no_permission"
        detail = `Faltam permissões: ${missing.join(", ")}`
      } else if (accounts.length === 0) {
        status = "no_accounts"
        detail = "Token válido, mas sem contas de anúncio vinculadas"
      } else {
        status = "connected"
        detail = `Conectada e saudável · ${accounts.length} conta(s)`
      }
    } catch (e) {
      const err = e as MetaApiError
      // Erro de autenticação/token expirado vs falha de sincronização
      status = err.code === 190 || /expired|token/i.test(err.message) ? "token_expired" : "sync_error"
      detail = err.message
    }
  } else {
    // Conexão com token próprio: validação estrutural (sem chamada real à Meta neste app)
    status = conn.access_token ? "connected" : "sync_error"
    detail = conn.access_token ? "Token armazenado presente" : "Sem token configurado"
  }

  const now = new Date().toISOString()
  await db
    .from("connections")
    .update({
      status,
      last_test_at: now,
      last_sync_at: status === "connected" ? now : conn.last_sync_at,
      name: userName ?? conn.name,
      updated_at: now,
    })
    .eq("id", id)

  await db.from("audit_logs").insert({
    actor: "Sistema",
    actor_type: "system",
    action: "test_connection",
    description: `Verificação da conexão "${conn.name}": ${detail}`,
    entity: "connection",
    connection_id: id,
  })

  return NextResponse.json({ status, detail, accountCount, permissions })
}
