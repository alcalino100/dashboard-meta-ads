// Dados mock realistas para o Dashboard Colucci (Meta Ads multi-conta)

export type Status = "active" | "paused" | "ended" | "review"
export type Objective = "Mensagens" | "Conversões" | "Tráfego" | "Alcance" | "Engajamento"

export const accounts = [
  { id: "act_1029", name: "Colucci Joias", spend: 18420.55, business: "Colucci Group" },
  { id: "act_2841", name: "Studio Bella", spend: 9210.3, business: "Bella Holding" },
  { id: "act_5573", name: "Móveis Norte", spend: 14870.0, business: "Norte Varejo" },
  { id: "act_7720", name: "Clínica Vitta", spend: 6340.8, business: "Vitta Saúde" },
]

export const kpis = [
  { key: "spend", label: "Gasto", value: 48841.65, prev: 44210.2, format: "currency" },
  { key: "impressions", label: "Impressões", value: 4128440, prev: 3980210, format: "number" },
  { key: "clicks", label: "Cliques no link", value: 61204, prev: 58320, format: "number" },
  { key: "cpc", label: "CPC", value: 0.8, prev: 0.76, format: "currency", invert: true },
  { key: "cpm", label: "CPM", value: 11.83, prev: 11.11, format: "currency", invert: true },
  { key: "ctr", label: "CTR", value: 1.48, prev: 1.46, format: "percent" },
  { key: "messages", label: "Mensagens iniciadas", value: 8932, prev: 8120, format: "number" },
  { key: "cpmsg", label: "Custo por mensagem", value: 5.47, prev: 5.44, format: "currency", invert: true },
] as const

export const trend = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(2026, 5, 2 + i)
  const base = 3200 + Math.sin(i / 2) * 700 + i * 45
  return {
    date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    gasto: Math.round(base),
    cliques: Math.round(base * 1.25 + Math.cos(i) * 120),
    mensagens: Math.round(base / 5.4 + Math.sin(i) * 40),
    custoMsg: +(5.1 + Math.sin(i / 3) * 0.6).toFixed(2),
  }
})

export const accountShare = accounts.map((a) => ({
  name: a.name,
  gasto: a.spend,
  mensagens: Math.round(a.spend / (4.8 + Math.random() * 1.4)),
}))

export type Campaign = {
  id: string
  name: string
  account: string
  objective: Objective
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
  owner: string
}

const owners = ["Rafael M.", "Júlia S.", "Bruno C.", "Ana P."]
const objectives: Objective[] = ["Mensagens", "Conversões", "Tráfego", "Alcance", "Engajamento"]
const statuses: Status[] = ["active", "paused", "ended", "review"]

export const campaigns: Campaign[] = Array.from({ length: 28 }, (_, i) => {
  const acc = accounts[i % accounts.length]
  const spend = +(800 + Math.random() * 6200).toFixed(2)
  const clicks = Math.round(spend / (0.6 + Math.random() * 0.5))
  const impressions = Math.round(clicks * (60 + Math.random() * 40))
  const messages = Math.round(clicks * (0.1 + Math.random() * 0.15))
  return {
    id: `cmp_${4000 + i}`,
    name: `${objectives[i % objectives.length]} ${acc.name.split(" ")[0]} ${i % 3 === 0 ? "Remarketing" : "Aquisição"}`,
    account: acc.name,
    objective: objectives[i % objectives.length],
    status: statuses[i % statuses.length],
    spend,
    impressions,
    clicks,
    cpc: +(spend / clicks).toFixed(2),
    ctr: +((clicks / impressions) * 100).toFixed(2),
    messages,
    costPerMsg: +(spend / Math.max(messages, 1)).toFixed(2),
    budget: Math.round((spend * (1.2 + Math.random() * 0.6)) / 10) * 10,
    start: "01/06/2026",
    end: i % 4 === 0 ? "30/06/2026" : "—",
    updated: `${(i % 12) + 1}h atrás`,
    owner: owners[i % owners.length],
  }
})

export type Role = "Super Admin" | "Gestor" | "Operador" | "Analista" | "Cliente Viewer"

export const users = [
  { name: "Rafael Moreira", email: "rafael@colucci.com", role: "Super Admin" as Role, accounts: 4, lastAccess: "Agora", status: "active" },
  { name: "Júlia Santana", email: "julia@colucci.com", role: "Gestor" as Role, accounts: 3, lastAccess: "12 min", status: "active" },
  { name: "Bruno Carvalho", email: "bruno@colucci.com", role: "Operador" as Role, accounts: 2, lastAccess: "2h", status: "active" },
  { name: "Ana Prado", email: "ana@colucci.com", role: "Analista" as Role, accounts: 4, lastAccess: "1 dia", status: "active" },
  { name: "Diretoria Bella", email: "diretoria@bella.com", role: "Cliente Viewer" as Role, accounts: 1, lastAccess: "3 dias", status: "inactive" },
]

export const roles: Role[] = ["Super Admin", "Gestor", "Operador", "Analista", "Cliente Viewer"]
export const permissionActions = ["Visualizar", "Exportar", "Editar", "Pausar", "Excluir", "Criar campanhas", "Gerenciar usuários"]

// matriz role -> ações permitidas (índices de permissionActions)
export const permissionMatrix: Record<Role, boolean[]> = {
  "Super Admin": [true, true, true, true, true, true, true],
  Gestor: [true, true, true, true, true, true, false],
  Operador: [true, true, true, true, false, false, false],
  Analista: [true, true, false, false, false, false, false],
  "Cliente Viewer": [true, false, false, false, false, false, false],
}

export type AlertItem = {
  id: string
  severity: "high" | "medium" | "low"
  title: string
  campaign: string
  detail: string
  time: string
}

export const alerts: AlertItem[] = [
  { id: "al_1", severity: "high", title: "Custo por mensagem acima do teto", campaign: "Mensagens Colucci Aquisição", detail: "R$ 9,80 vs meta R$ 6,00", time: "8 min" },
  { id: "al_2", severity: "high", title: "Campanha sem entrega", campaign: "Conversões Studio Remarketing", detail: "0 impressões nas últimas 6h", time: "22 min" },
  { id: "al_3", severity: "medium", title: "CPC acima da meta", campaign: "Tráfego Móveis Aquisição", detail: "R$ 1,42 vs meta R$ 1,00", time: "1h" },
  { id: "al_4", severity: "medium", title: "Frequência alta", campaign: "Alcance Vitta Aquisição", detail: "Frequência 4,8 em 7 dias", time: "2h" },
  { id: "al_5", severity: "low", title: "Orçamento limitado", campaign: "Engajamento Colucci Remarketing", detail: "Gasto em 96% do orçamento diário", time: "3h" },
]

export const events = [
  { actor: "Júlia S.", action: "pausou", target: "Tráfego Móveis Aquisição", time: "10 min" },
  { actor: "Sistema", action: "disparou alerta", target: "Custo por mensagem acima do teto", time: "8 min" },
  { actor: "Bruno C.", action: "ajustou orçamento de", target: "Mensagens Colucci Aquisição", time: "35 min" },
  { actor: "Rafael M.", action: "criou", target: "Conversões Bella Aquisição", time: "1h" },
  { actor: "Ana P.", action: "exportou relatório de", target: "Visão geral — Junho", time: "2h" },
]

// ── Auditoria ───────────────────────────────────────────────
export type AuditAction = "login" | "logout" | "login_failed" | "permission_change" | "critical"
export type AuditLog = {
  id: string
  actor: string
  action: AuditAction
  description: string
  account: string
  ip: string
  date: string
}
const auditActors = ["Rafael Moreira", "Júlia Santana", "Bruno Carvalho", "Ana Prado", "Sistema"]
const auditTemplates: { action: AuditAction; description: string }[] = [
  { action: "login", description: "Login realizado com sucesso" },
  { action: "login_failed", description: "Falha de login — senha incorreta" },
  { action: "permission_change", description: "Alterou nível de acesso de Operador para Gestor" },
  { action: "critical", description: "Excluiu campanha Conversões Studio Remarketing" },
  { action: "critical", description: "Pausou 4 campanhas em massa" },
  { action: "logout", description: "Sessão encerrada pelo usuário" },
  { action: "permission_change", description: "Removeu acesso à conta Móveis Norte" },
  { action: "critical", description: "Resetou senha de diretoria@bella.com" },
]
export const auditLogs: AuditLog[] = Array.from({ length: 22 }, (_, i) => {
  const t = auditTemplates[i % auditTemplates.length]
  const acc = accounts[i % accounts.length]
  const h = i
  return {
    id: `aud_${900 + i}`,
    actor: auditActors[i % auditActors.length],
    action: t.action,
    description: t.description,
    account: acc.name,
    ip: `189.${40 + (i % 60)}.${10 + i}.${(i * 7) % 255}`,
    date: `${String(16 - Math.floor(i / 8)).padStart(2, "0")}/06 ${String(23 - (h % 24)).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}`,
  }
})

// ── Integração Meta ─────────────────────────────────────────
export type ConnStatus = "connected" | "expiring" | "no_permission" | "sync_error"
export type Connection = {
  id: string
  name: string
  businessId: string
  appId: string
  accounts: number
  status: ConnStatus
  lastSync: string
}
export const connections: Connection[] = [
  { id: "con_1", name: "Colucci Group BM", businessId: "178402993115", appId: "994201", accounts: 2, status: "connected", lastSync: "há 4 min" },
  { id: "con_2", name: "Bella Holding BM", businessId: "204918883201", appId: "994201", accounts: 1, status: "expiring", lastSync: "há 12 min" },
  { id: "con_3", name: "Norte Varejo BM", businessId: "552019384726", appId: "771028", accounts: 1, status: "sync_error", lastSync: "há 3 h" },
  { id: "con_4", name: "Vitta Saúde BM", businessId: "330948271665", appId: "771028", accounts: 1, status: "no_permission", lastSync: "—" },
]

export const entities = [
  { name: "Business", desc: "Business Manager raiz", fields: ["id", "name", "appId", "systemUserToken"], rel: "1 → N AdAccount" },
  { name: "AdAccount", desc: "Conta de anúncio", fields: ["id", "businessId", "name", "currency", "timezone"], rel: "1 → N Campaign" },
  { name: "Campaign", desc: "Campanha", fields: ["id", "accountId", "objective", "status", "budget"], rel: "1 → N AdSet" },
  { name: "AdSet", desc: "Conjunto de anúncios", fields: ["id", "campaignId", "targeting", "placements"], rel: "1 → N Ad" },
  { name: "Ad", desc: "Anúncio / criativo", fields: ["id", "adsetId", "creativeId", "status"], rel: "1 → N InsightSnapshot" },
  { name: "InsightSnapshot", desc: "Métricas por dia/nível", fields: ["entityId", "level", "date", "metrics"], rel: "N → 1 Ad" },
  { name: "UserAccess", desc: "Acesso por usuário/conta", fields: ["userId", "accountId", "role", "scopes"], rel: "N → N" },
  { name: "AuditLog", desc: "Eventos críticos", fields: ["actorId", "action", "target", "createdAt"], rel: "—" },
  { name: "SyncJob", desc: "Job de sincronização", fields: ["accountId", "status", "window", "finishedAt"], rel: "N → 1 AdAccount" },
]

export type JobStatus = "queued" | "processing" | "success" | "partial" | "failed"
export const syncJobs = Array.from({ length: 8 }, (_, i) => {
  const st: JobStatus[] = ["success", "processing", "partial", "queued", "failed", "success", "success", "processing"]
  const acc = accounts[i % accounts.length]
  return {
    id: `job_${500 + i}`,
    account: acc.name,
    status: st[i],
    window: i % 2 === 0 ? "Últimos 7 dias" : "Últimos 30 dias",
    rows: Math.round(1200 + Math.random() * 8000),
    duration: `${(2 + Math.random() * 40).toFixed(1)}s`,
    finished: st[i] === "queued" || st[i] === "processing" ? "—" : `há ${i + 1} min`,
  }
})

export const metricDefs = [
  { key: "spend", label: "Gasto", group: "core", desc: "Valor investido no período" },
  { key: "impressions", label: "Impressões", group: "core", desc: "Exibições do anúncio" },
  { key: "reach", label: "Alcance", group: "core", desc: "Pessoas únicas alcançadas" },
  { key: "clicks", label: "Cliques", group: "core", desc: "Todos os cliques" },
  { key: "link_clicks", label: "Cliques no link", group: "core", desc: "Cliques no destino" },
  { key: "cpc", label: "CPC", group: "efficiency", desc: "Custo por clique no link" },
  { key: "cpm", label: "CPM", group: "efficiency", desc: "Custo por mil impressões" },
  { key: "ctr", label: "CTR", group: "efficiency", desc: "Taxa de cliques" },
  { key: "frequency", label: "Frequência", group: "efficiency", desc: "Médias de exibições por pessoa" },
  { key: "actions", label: "Ações", group: "actions", desc: "Conversões rastreadas" },
  { key: "cost_per_action_type", label: "Custo por ação", group: "actions", desc: "Custo por tipo de resultado" },
  { key: "action_values", label: "Valor das ações", group: "actions", desc: "Receita atribuída" },
]
export const messageMetrics = [
  { key: "messaging_conversation_started", label: "Conversas iniciadas", value: "8.932" },
  { key: "cost_per_messaging_conversation", label: "Custo por conversa", value: "R$ 5,47" },
  { key: "messaging_replies", label: "Respostas recebidas", value: "6.140" },
  { key: "cost_per_reply", label: "Custo por resposta", value: "R$ 7,96" },
]

// ── Metas & Inteligência ────────────────────────────────────
export const goals = [
  { account: "Colucci Joias", objective: "Custo por mensagem", target: 6.0, current: 5.47, unit: "R$", dir: "down" as const },
  { account: "Studio Bella", objective: "CPC", target: 1.0, current: 1.18, unit: "R$", dir: "down" as const },
  { account: "Móveis Norte", objective: "CTR", target: 1.5, current: 1.62, unit: "%", dir: "up" as const },
  { account: "Clínica Vitta", objective: "Mensagens/dia", target: 120, current: 86, unit: "", dir: "up" as const },
]

export const ranking = campaigns
  .map((c) => ({ name: c.name, account: c.account, costPerMsg: c.costPerMsg, ctr: c.ctr, spend: c.spend }))
  .sort((a, b) => a.costPerMsg - b.costPerMsg)

export const heatmap = accounts.map((a) => ({
  account: a.name,
  values: objectives.map((o) => ({
    objective: o,
    score: Math.round(35 + Math.random() * 65),
  })),
}))

export type Recommendation = { id: string; priority: "high" | "medium" | "low"; text: string; account: string }
export const recommendations: Recommendation[] = [
  { id: "rec_1", priority: "high", text: "Pausar 'Conversões Studio Remarketing' — sem entrega há 6h e gasto acelerado.", account: "Studio Bella" },
  { id: "rec_2", priority: "high", text: "Revisar criativo de 'Mensagens Colucci Aquisição' — custo por mensagem 63% acima da meta.", account: "Colucci Joias" },
  { id: "rec_3", priority: "medium", text: "Realocar orçamento de Móveis Norte para campanhas com CTR acima de 1,8%.", account: "Móveis Norte" },
  { id: "rec_4", priority: "medium", text: "Reduzir frequência em 'Alcance Vitta' — saturação de público em 7 dias.", account: "Clínica Vitta" },
  { id: "rec_5", priority: "low", text: "Testar novos públicos lookalike para escalar campanhas eficientes.", account: "Colucci Joias" },
]

export const insights = [
  "Custo por mensagem da conta Colucci subiu 11% nos últimos 3 dias.",
  "Studio Bella concentra 38% do gasto com apenas 21% das mensagens.",
  "Campanhas de Mensagens superam Conversões em eficiência de custo nesta semana.",
]

// ── Permissões por conta ────────────────────────────────────
export const accountPermissions = users.map((u, i) => ({
  user: u.name,
  perAccount: accounts.map((a, j) => ({
    account: a.name,
    level: (["full", "edit", "view", "none"] as const)[(i + j) % 4],
  })),
}))

// rótulos de navegação
export const navItems = [
  "Overview", "Campanhas", "Criativos", "Integrações", "Regras", "Alertas",
  "Metas", "Inteligência", "Usuários", "Auditoria", "Configurações",
] as const
export type NavItem = (typeof navItems)[number]
