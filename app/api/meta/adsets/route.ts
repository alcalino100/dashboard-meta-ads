import { NextResponse } from "next/server"
import { getAdAccounts, getAdSets, MetaApiError } from "@/lib/meta-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams
    const range = params.get("range") ?? "last_30d"
    const campaign = params.get("campaign") // drill-down por campanha
    let accountId = params.get("account")

    const accounts = await getAdAccounts()
    if (!accountId) accountId = accounts.find((a) => a.amountSpent > 0)?.id ?? accounts[0]?.id ?? null
    if (!accountId) return NextResponse.json({ adsets: [] })

    const adsets = await getAdSets(accountId, campaign, range)
    adsets.sort((a, b) => b.spend - a.spend)
    return NextResponse.json({ adsets })
  } catch (e) {
    const err = e as MetaApiError
    return NextResponse.json({ error: err.message, code: err.code ?? null }, { status: 502 })
  }
}
