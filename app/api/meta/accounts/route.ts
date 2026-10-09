import { NextResponse } from "next/server"
import { getAdAccounts, getActiveClient, MetaApiError } from "@/lib/meta-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [accounts, active] = await Promise.all([getAdAccounts(), getActiveClient()])
    return NextResponse.json({ accounts, client: active.client, connectionId: active.connectionId })
  } catch (e) {
    const err = e as MetaApiError
    return NextResponse.json({ error: err.message, code: err.code ?? null }, { status: 502 })
  }
}
