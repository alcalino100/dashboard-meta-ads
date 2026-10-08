import { NextResponse } from "next/server"
import { getAdAccounts, getAds, MetaApiError } from "@/lib/meta-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/meta/creatives?range=last_30d&account=act_..&sort=messages&limit=24
// Ranking de criativos (nível anúncio) com campanha/conjunto + thumbnail,
// sem precisar navegar campanha → conjunto → anúncio.
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams
    const range = params.get("range") ?? "last_30d"
    const sort = params.get("sort") ?? "messages"
    const limit = Math.min(Number(params.get("limit") ?? 24), 100)
    let accountId = params.get("account")

    const accounts = await getAdAccounts()
    if (!accountId) accountId = accounts.find((a) => a.amountSpent > 0)?.id ?? accounts[0]?.id ?? null
    if (!accountId) return NextResponse.json({ creatives: [] })

    const ads = await getAds(accountId, null, range)

    const by = {
      messages: (a: (typeof ads)[number], b: (typeof ads)[number]) => b.messages - a.messages || b.spend - a.spend,
      spend: (a: (typeof ads)[number], b: (typeof ads)[number]) => b.spend - a.spend,
      costPerMsg: (a: (typeof ads)[number], b: (typeof ads)[number]) =>
        (a.costPerMsg || Infinity) - (b.costPerMsg || Infinity),
      ctr: (a: (typeof ads)[number], b: (typeof ads)[number]) => b.ctr - a.ctr,
    }[sort] ?? ((a: (typeof ads)[number], b: (typeof ads)[number]) => b.messages - a.messages || b.spend - a.spend)

    const creatives = [...ads].sort(by).slice(0, limit)
    return NextResponse.json({ creatives, accountId, sort })
  } catch (e) {
    const err = e as MetaApiError
    return NextResponse.json({ error: err.message, code: err.code ?? null }, { status: 502 })
  }
}
