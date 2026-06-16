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

// rótulos de navegação
export const navItems = [
  "Overview", "Contas", "Campanhas", "Conjuntos", "Anúncios",
  "Criativos", "Regras", "Alertas", "Relatórios", "Usuários", "Configurações",
] as const
export type NavItem = (typeof navItems)[number]
