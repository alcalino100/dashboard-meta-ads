const { createClient } = require("@supabase/supabase-js")
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
;(async () => {
  // tenta inserir e ler de volta para descobrir colunas
  const { data, error } = await sb.from("app_users").select("*").limit(1)
  console.log("select error:", error?.message)
  console.log("sample row:", data)
  // descobre colunas via insert dummy then rollback (apenas testa erro de coluna)
  const { error: e2 } = await sb.from("app_users").insert({ name: "x", email: "____probe@test.x", role: "Operador", account_ids: [], status: "active", auth_id: "00000000-0000-0000-0000-000000000000" }).select()
  console.log("auth_id probe error:", e2?.message)
  await sb.from("app_users").delete().eq("email", "____probe@test.x")
})()
