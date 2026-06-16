import { NextResponse } from "next/server"
import { getMe, getPermissions, getAdAccounts, MetaApiError } from "@/lib/meta-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [me, permissions, accounts] = await Promise.all([
      getMe(),
      getPermissions(),
      getAdAccounts(),
    ])
    return NextResponse.json({
      connected: true,
      user: me,
      appId: process.env.META_APP_ID ?? null,
      permissions,
      accountCount: accounts.length,
    })
  } catch (e) {
    const err = e as MetaApiError
    return NextResponse.json(
      { connected: false, error: err.message, code: err.code ?? null },
      { status: err.type === "config" ? 500 : 200 },
    )
  }
}
