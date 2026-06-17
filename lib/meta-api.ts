import "server-only"

const API_VERSION = "v22.0"
const BASE = `https://graph.facebook.com/${API_VERSION}`

export class MetaApiError extends Error {
  code?: number
  type?: string
  constructor(message: string, code?: number, type?: string) {
    super(message)
    this.name = "MetaApiError"
    this.code = code
    this.type = type
  }
}

function token() {
  const t = process.env.META_ACCESS_TOKEN
  if (!t) throw new MetaApiError("META_ACCESS_TOKEN não configurado no servidor.", 0, "config")
  return t
}

async function graph<T = any>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}/${path}`)
  url.searchParams.set("access_token", token())
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString(), { cache: "no-store" })
  const json = await res.json()
  if (json.error) {
    if (json.error.code === 190) {
      throw new MetaApiError(
        "Token Meta expirado. Acesse as configurações e atualize o META_ACCESS_TOKEN com um System User Token permanente.",
        190,
        "token_expired",
      )
    }
    throw new MetaApiError(json.error.message, json.error.code, json.error.type)
  }
  return json as T
}

// ── Datas (estilo Ads Manager) ──────────────────────────────
// Aceita presets da Meta ou "custom:YYYY-MM-DD:YYYY-MM-DD".
export function applyDate(params: Record<string, string>, date?: string) {
  if (date && date.startsWith("custom:")) {
    const [, since, until] = date.split(":")
    if (since && until) {
      params.time_range = JSON.stringify({ since, until })
      return params
    }
  }
  params.date_preset = date && !date.startsWith("custom:") ? date : "last_30d"
  return params
}

// ── Mapeamentos ─────────────────────────────────────────────
export type Status = "active" | "paused" | "ended" | "review"

export function mapStatus(s: string): Status {
  switch (s) {
    case "ACTIVE":
      return "active"
    case "PAUSED":
    case "CAMPAIGN_PAUSED":
      return "paused"
    case "ARCHIVED":
    case "DELETED":
      return "ended"
    default:
      return "review"
  }
}

const OBJECTIVE_PT: Record<string, string> = {
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_SALES: "Conversões",
  OUTCOME_LEADS: "Conversões",
  OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_AWARENESS: "Alcance",
  OUTCOME_APP_PROMOTION: "Tráfego",
  MESSAGES: "Mensagens",
  CONVERSIONS: "Conversões",
  LINK_CLICKS: "Tráfego",
  REACH: "Alcance",
  POST_ENGAGEMENT: "Engajamento",
  BRAND_AWARENESS: "Alcance",
}

export function mapObjective(o: string): string {
  return OBJECTIVE_PT[o] ?? o.replace("OUTCOME_", "").toLowerCase()
}

// soma valores de tipos de ação que correspondem a um padrão
function sumActions(actions: { action_type: string; value: string }[] | undefined, match: (t: string) => boolean): number {
  if (!actions) return 0
  return actions.filter((a) => match(a.action_type)).reduce((acc, a) => acc + Number(a.value || 0), 0)
}

function messagesFrom(actions?: { action_type: string; value: string }[]): number {
  return sumActions(actions, (t) => t.includes("messaging_conversation_started"))
}

// ── Tipos públicos ──────────────────────────────────────────
export type MetaAccount = {
  id: string
  accountId: string
  name: string
  currency: string
  status: number
  amountSpent: number
}

export type Insights = {
  spend: number
  impressions: number
  clicks: number
  linkClicks: number
  cpc: number
  cpm: number
  ctr: number
  reach: number
  frequency: number
  messages: number
  costPerMsg: number
}

export type MetaCampaign = {
  id: string
  name: string
  account: string
  objective: string
  status: Status
  spend: number
  impressions: number
  clicks: number
  cpc: number
  ctr: number
  messages: number
  costPerMsg: number
  budget: number
  start: string
  end: string
  updated: string
}

const INSIGHT_FIELDS =
  "spend,impressions,clicks,inline_link_clicks,cpc,cpm,ctr,reach,frequency,actions"

function parseInsights(row: any): Insights {
  const spend = Number(row?.spend || 0)
  const messages = messagesFrom(row?.actions)
  return {
    spend,
    impressions: Number(row?.impressions || 0),
    clicks: Number(row?.clicks || 0),
    linkClicks: Number(row?.inline_link_clicks || 0),
    cpc: Number(row?.cpc || 0),
    cpm: Number(row?.cpm || 0),
    ctr: Number(row?.ctr || 0),
    reach: Number(row?.reach || 0),
    frequency: Number(row?.frequency || 0),
    messages,
    costPerMsg: messages > 0 ? +(spend / messages).toFixed(2) : 0,
  }
}

const EMPTY_INSIGHTS: Insights = {
  spend: 0, impressions: 0, clicks: 0, linkClicks: 0, cpc: 0, cpm: 0,
  ctr: 0, reach: 0, frequency: 0, messages: 0, costPerMsg: 0,
}

// ── Funções de API ──────────────────────────────────────────
export async function getMe() {
  return graph<{ id: string; name: string }>("me", { fields: "id,name" })
}

export async function getPermissions(): Promise<string[]> {
  const r = await graph<{ data: { permission: string; status: string }[] }>("me/permissions")
  return r.data.filter((p) => p.status === "granted").map((p) => p.permission)
}

export async function getAdAccounts(): Promise<MetaAccount[]> {
  const all: any[] = []
  let after: string | undefined
  for (let page = 0; page < 10; page++) {
    const params: Record<string, string> = {
      fields: "name,account_id,currency,account_status,amount_spent",
      limit: "100",
    }
    if (after) params.after = after
    const r = await graph<{ data: any[]; paging?: { next?: string; cursors?: { after?: string } } }>(
      "me/adaccounts",
      params,
    )
    all.push(...(r.data ?? []))
    if (!r.paging?.next || !r.paging?.cursors?.after) break
    after = r.paging.cursors.after
  }
  return all.map((a) => ({
    id: a.id,
    accountId: a.account_id,
    name: a.name || `Conta ${a.account_id}`,
    currency: a.currency,
    status: a.account_status,
    amountSpent: Number(a.amount_spent || 0) / 100,
  }))
}

export async function getAccountInsights(actId: string, datePreset = "last_30d"): Promise<Insights> {
  const r = await graph<{ data: any[] }>(`${actId}/insights`, applyDate({ fields: INSIGHT_FIELDS }, datePreset))
  if (!r.data?.length) return EMPTY_INSIGHTS
  return parseInsights(r.data[0])
}

export async function getDailyTrend(actId: string, datePreset = "last_14d") {
  const r = await graph<{ data: any[] }>(`${actId}/insights`, applyDate({
    fields: "spend,inline_link_clicks,actions",
    time_increment: "1",
    limit: "90",
  }, datePreset))
  return (r.data ?? []).map((row) => {
    const spend = Number(row.spend || 0)
    const messages = messagesFrom(row.actions)
    const [y, m, d] = (row.date_start as string).split("-")
    return {
      date: `${d}/${m}`,
      gasto: Math.round(spend),
      cliques: Number(row.inline_link_clicks || 0),
      mensagens: messages,
      custoMsg: messages > 0 ? +(spend / messages).toFixed(2) : 0,
    }
  })
}

export async function getCampaigns(actId: string, accountName: string, datePreset = "last_30d"): Promise<MetaCampaign[]> {
  const [campaignsRes, insightsRes] = await Promise.all([
    graph<{ data: any[] }>(`${actId}/campaigns`, {
      fields: "name,objective,status,daily_budget,lifetime_budget,start_time,stop_time,updated_time",
      limit: "200",
    }),
    graph<{ data: any[] }>(`${actId}/insights`, applyDate({
      level: "campaign",
      fields: "campaign_id,campaign_name,spend,impressions,clicks,cpc,ctr,actions",
      limit: "500",
    }, datePreset)),
  ])

  const insightsById = new Map<string, any>()
  for (const row of insightsRes.data ?? []) insightsById.set(row.campaign_id, row)

  return (campaignsRes.data ?? []).map((c) => {
    const ins = insightsById.get(c.id)
    const spend = Number(ins?.spend || 0)
    const messages = messagesFrom(ins?.actions)
    const budget = Number(c.daily_budget || c.lifetime_budget || 0) / 100
    return {
      id: c.id,
      name: c.name,
      account: accountName,
      objective: mapObjective(c.objective),
      status: mapStatus(c.status),
      spend,
      impressions: Number(ins?.impressions || 0),
      clicks: Number(ins?.clicks || 0),
      cpc: Number(ins?.cpc || 0),
      ctr: Number(ins?.ctr || 0),
      messages,
      costPerMsg: messages > 0 ? +(spend / messages).toFixed(2) : 0,
      budget,
      start: c.start_time && !c.start_time.startsWith("1969") ? c.start_time.slice(0, 10).split("-").reverse().join("/") : "—",
      end: c.stop_time ? c.stop_time.slice(0, 10).split("-").reverse().join("/") : "—",
      updated: c.updated_time ? c.updated_time.slice(0, 10).split("-").reverse().join("/") : "—",
    }
  })
}

function fmtDate(s?: string) {
  return s && !s.startsWith("1969") ? s.slice(0, 10).split("-").reverse().join("/") : "—"
}

// ── Conjuntos de anúncios (Ad Sets) ─────────────────────────
export type MetaAdSet = {
  id: string
  name: string
  campaignId: string
  status: Status
  spend: number
  impressions: number
  clicks: number
  cpc: number
  ctr: number
  messages: number
  costPerMsg: number
  budget: number
  optimization: string
  billing: string
  placements: string
  start: string
  end: string
}

export async function getAdSets(actId: string, parentId: string | null, datePreset = "last_30d"): Promise<MetaAdSet[]> {
  const node = parentId ? parentId : actId
  try {
    const [setsRes, insRes] = await Promise.all([
      graph<{ data: any[] }>(`${node}/adsets`, {
        fields: "name,campaign_id,status,daily_budget,lifetime_budget,optimization_goal,billing_event,targeting{publisher_platforms},start_time,end_time",
        limit: "200",
      }),
      graph<{ data: any[] }>(`${node}/insights`, applyDate({
        level: "adset",
        fields: "adset_id,spend,impressions,clicks,cpc,ctr,actions",
        limit: "500",
      }, datePreset)),
    ])
    const byId = new Map<string, any>()
    for (const row of insRes.data ?? []) byId.set(row.adset_id, row)
    return (setsRes.data ?? []).map((s) => {
      const ins = byId.get(s.id)
      const spend = Number(ins?.spend || 0)
      const messages = messagesFrom(ins?.actions)
      const platforms = s.targeting?.publisher_platforms as string[] | undefined
      return {
        id: s.id,
        name: s.name,
        campaignId: s.campaign_id,
        status: mapStatus(s.status),
        spend,
        impressions: Number(ins?.impressions || 0),
        clicks: Number(ins?.clicks || 0),
        cpc: Number(ins?.cpc || 0),
        ctr: Number(ins?.ctr || 0),
        messages,
        costPerMsg: messages > 0 ? +(spend / messages).toFixed(2) : 0,
        budget: Number(s.daily_budget || s.lifetime_budget || 0) / 100,
        optimization: s.optimization_goal ?? "—",
        billing: s.billing_event ?? "—",
        placements: platforms?.length ? platforms.join(", ") : "Automático",
        start: fmtDate(s.start_time),
        end: fmtDate(s.end_time),
      }
    })
  } catch (e) {
    const err = e as MetaApiError
    if (err.code === 403 || err.code === 100) return []
    throw e
  }
}

// ── Anúncios (Ads) ──────────────────────────────────────────
export type MetaAd = {
  id: string
  name: string
  adsetId: string
  campaignId: string
  status: Status
  spend: number
  impressions: number
  clicks: number
  cpc: number
  ctr: number
  messages: number
  costPerMsg: number
  thumbnail: string | null
  title: string
  body: string
}

export async function getAds(actId: string, parentId: string | null, datePreset = "last_30d"): Promise<MetaAd[]> {
  const node = parentId ? parentId : actId
  try {
    const [adsRes, insRes] = await Promise.all([
      graph<{ data: any[] }>(`${node}/ads`, {
        fields: "name,adset_id,campaign_id,status,creative{thumbnail_url,title,body}",
        limit: "200",
      }),
      graph<{ data: any[] }>(`${node}/insights`, applyDate({
        level: "ad",
        fields: "ad_id,spend,impressions,clicks,cpc,ctr,actions",
        limit: "500",
      }, datePreset)),
    ])
    const byId = new Map<string, any>()
    for (const row of insRes.data ?? []) byId.set(row.ad_id, row)
    return (adsRes.data ?? []).map((a) => {
      const ins = byId.get(a.id)
      const spend = Number(ins?.spend || 0)
      const messages = messagesFrom(ins?.actions)
      return {
        id: a.id,
        name: a.name,
        adsetId: a.adset_id,
        campaignId: a.campaign_id,
        status: mapStatus(a.status),
        spend,
        impressions: Number(ins?.impressions || 0),
        clicks: Number(ins?.clicks || 0),
        cpc: Number(ins?.cpc || 0),
        ctr: Number(ins?.ctr || 0),
        messages,
        costPerMsg: messages > 0 ? +(spend / messages).toFixed(2) : 0,
        thumbnail: a.creative?.thumbnail_url ?? null,
        title: a.creative?.title ?? a.name,
        body: a.creative?.body ?? "—",
      }
    })
  } catch (e) {
    const err = e as MetaApiError
    if (err.code === 403 || err.code === 100) return []
    throw e
  }
}
