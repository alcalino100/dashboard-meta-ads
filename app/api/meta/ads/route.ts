import { NextResponse } from "next/server"
import { getAdAccounts, getAds, MetaApiError } from "@/lib/meta-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams
    const range = params.get("range") ?? "last_30d"
    const adset = params.get("adset") // drill-down por conjunto
    let accountId = params.get("account")

    const accounts = await getAdAccounts()
    if (!accountId) accountId = accounts.find((a) => a.amountSpent > 0)?.id ?? accounts[0]?.id ?? null
    if (!accountId) return NextResponse.json({ ads: [] })

    const ads = await getAds(accountId, adset, range)
    ads.sort((a, b) => b.spend - a.spend)
    return NextResponse.json({ ads })
  } catch (e) {
    const err = e as MetaApiError
    return NextResponse.json({ error: err.message, code: err.code ?? null }, { status: 502 })
  }
}
