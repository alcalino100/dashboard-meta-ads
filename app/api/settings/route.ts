import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from("app_settings")
    .select("payload")
    .eq("id", "global")
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data?.payload ?? {} })
}

export async function PUT(req: Request) {
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
