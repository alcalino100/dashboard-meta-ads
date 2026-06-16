import { NextResponse } from "next/server"
import { supabaseAdmin, isSupabaseConfigured, SUPABASE_NOT_CONFIGURED } from "@/lib/supabase/admin"

const notConfigured = () => NextResponse.json({ error: SUPABASE_NOT_CONFIGURED }, { status: 503 })

export async function GET() {
  if (!isSupabaseConfigured()) return notConfigured()
  const { data, error } = await supabaseAdmin()
    .from("app_settings")
    .select("payload")
    .eq("id", "global")
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data?.payload ?? {} })
}

export async function PUT(req: Request) {
  if (!isSupabaseConfigured()) return notConfigured()
  const payload = await req.json()
  const { data, error } = await supabaseAdmin()
    .from("app_settings")
    .upsert({ id: "global", payload, updated_at: new Date().toISOString() })
    .select("payload")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabaseAdmin()
    .from("audit_logs")
    .insert({ actor: "Você", action: "settings", description: "Atualizou as configurações do painel" })
  return NextResponse.json({ settings: data.payload })
}
