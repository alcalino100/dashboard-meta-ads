import { NextResponse } from "next/server"
import { getMe, getPermissions, getAdAccounts, MetaApiError } from "@/lib/meta-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type TokenType = "system_user" | "user" | "unknown"

async function detectTokenType(): Promise<TokenType> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const accessToken = process.env.META_ACCESS_TOKEN
  if (!appId || !appSecret || !accessToken) return "unknown"
  try {
    const url = new URL("https://graph.facebook.com/v22.0/debug_token")
    url.searchParams.set("input_token", accessToken)
    url.searchParams.set("access_token", `${appId}|${appSecret}`)
    const res = await fetch(url.toString(), { cache: "no-store" })
    const json = await res.json()
    const type = json?.data?.type
    if (type === "SYSTEM_USER") return "system_user"
    if (type === "USER") return "user"
    return "unknown"
  } catch {
    return "unknown"
  }
}

export async function GET() {
  try {
    const [me, permissions, accounts, tokenType] = await Promise.all([
      getMe(),
      getPermissions(),
      getAdAccounts(),
      detectTokenType(),
    ])
    return NextResponse.json({
      connected: true,
      user: me,
      appId: process.env.META_APP_ID ?? null,
      permissions,
      accountCount: accounts.length,
      tokenType,
    })
  } catch (e) {
    const err = e as MetaApiError
    return NextResponse.json(
      { connected: false, error: err.message, code: err.code ?? null },
      { status: err.type === "config" ? 500 : 200 },
    )
  }
}
