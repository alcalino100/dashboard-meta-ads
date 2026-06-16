import { NextResponse } from "next/server"
import { getAdAccounts, getCampaigns, MetaApiError } from "@/lib/meta-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams
    const range = params.get("range") ?? "last_30d"
    let accountId = params.get("account")

    const accounts = await getAdAccounts()
    const options = accounts
      .filter((a) => a.amountSpent > 0)
      .map((a) => ({ id: a.id, name: a.name }))

    if (!accountId) accountId = options[0]?.id ?? accounts[0]?.id ?? null
    if (!accountId) return NextResponse.json({ campaigns: [], accounts: options })

    const accountName = accounts.find((a) => a.id === accountId)?.name ?? accountId
    const campaigns = await getCampaigns(accountId, accountName, range)
    campaigns.sort((a, b) => b.spend - a.spend)

    return NextResponse.json({ campaigns, accounts: options, accountId })
  } catch (e) {
    const err = e as MetaApiError
    return NextResponse.json({ error: err.message, code: err.code ?? null }, { status: 502 })
  }
}
