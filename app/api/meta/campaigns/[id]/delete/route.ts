import { NextResponse } from "next/server"
import { MetaApiError } from "@/lib/meta-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const API_VERSION = "v21.0"
const BASE = `https://graph.facebook.com/${API_VERSION}`

function token() {
  const t = process.env.META_ACCESS_TOKEN
  if (!t) throw new MetaApiError("META_ACCESS_TOKEN não configurado.", 0, "config")
  return t
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    // A Meta arquiva ao invés de deletar permanentemente
    const url = new URL(`${BASE}/${params.id}`)
    const body = new URLSearchParams()
    body.set("status", "ARCHIVED")
    body.set("access_token", token())
    const res = await fetch(url.toString(), { method: "POST", body })
    const json = await res.json()
    if (json.error) {
      return NextResponse.json({ error: json.error.message, code: json.error.code }, { status: 400 })
    }
    return NextResponse.json({ success: true, id: params.id, archived: true })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
