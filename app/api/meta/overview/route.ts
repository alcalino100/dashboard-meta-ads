import { NextResponse } from "next/server"
import { getAdAccounts, getAccountInsights, getDailyTrend, MetaApiError, type Insights } from "@/lib/meta-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_ACCOUNTS = 8

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams
    const range = params.get("range") ?? "last_30d"
    const account = params.get("account")
    const trendRange = range

    const accounts = await getAdAccounts()
    const spenders = account
      ? accounts.filter((a) => a.id === account)
      : accounts.filter((a) => a.amountSpent > 0).slice(0, MAX_ACCOUNTS)

    const results = await Promise.all(
      spenders.map(async (a) => ({
        account: a,
        insights: await getAccountInsights(a.id, range),
        trend: await getDailyTrend(a.id, trendRange),
      })),
    )

    // Agrega KPIs
    const totals: Insights = {
      spend: 0, impressions: 0, clicks: 0, linkClicks: 0, cpc: 0, cpm: 0,
      ctr: 0, reach: 0, frequency: 0, messages: 0, costPerMsg: 0,
    }
    for (const { insights } of results) {
      totals.spend += insights.spend
      totals.impressions += insights.impressions
      totals.clicks += insights.clicks
      totals.linkClicks += insights.linkClicks
      totals.reach += insights.reach
      totals.messages += insights.messages
    }
    totals.cpc = totals.linkClicks > 0 ? +(totals.spend / totals.linkClicks).toFixed(2) : 0
    totals.cpm = totals.impressions > 0 ? +((totals.spend / totals.impressions) * 1000).toFixed(2) : 0
    totals.ctr = totals.impressions > 0 ? +((totals.clicks / totals.impressions) * 100).toFixed(2) : 0
    totals.costPerMsg = totals.messages > 0 ? +(totals.spend / totals.messages).toFixed(2) : 0

    // Participação por conta
    const accountShare = results
      .map(({ account, insights }) => ({
        name: account.name,
        gasto: +insights.spend.toFixed(2),
        mensagens: insights.messages,
      }))
      .sort((a, b) => b.gasto - a.gasto)

    // Tendência diária agregada
    const trendMap = new Map<string, { date: string; gasto: number; cliques: number; mensagens: number; custoMsg: number }>()
    for (const { trend } of results) {
      for (const p of trend) {
        const cur = trendMap.get(p.date) ?? { date: p.date, gasto: 0, cliques: 0, mensagens: 0, custoMsg: 0 }
        cur.gasto += p.gasto
        cur.cliques += p.cliques
        cur.mensagens += p.mensagens
        trendMap.set(p.date, cur)
      }
    }
    const trend = Array.from(trendMap.values()).map((t) => ({
      ...t,
      custoMsg: t.mensagens > 0 ? +(t.gasto / t.mensagens).toFixed(2) : 0,
    }))

    return NextResponse.json({
      totals,
      accountShare,
      trend,
      accountsConsidered: spenders.length,
    })
  } catch (e) {
    const err = e as MetaApiError
    return NextResponse.json({ error: err.message, code: err.code ?? null }, { status: 502 })
  }
}
