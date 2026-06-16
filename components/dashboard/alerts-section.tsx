"use client"

import { useState, useMemo } from "react"
import { Plus, Trash2, BellRing, Power, ShieldAlert, ShieldCheck } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { fmtCurrency } from "@/lib/format"
import { ConnectionGate, LoadingState, ErrorState, DataEmptyState } from "./states"
import { useNavigate } from "@/lib/nav-context"
import { useFilters } from "@/lib/filters-context"
import { useCampaigns } from "@/lib/use-meta"
import { useRules, useAudit, useConnections, createItem, deleteItem, patchItem, type Rule } from "@/lib/use-store"

// Avalia regras ativas contra métricas reais de campanha (spec Seção 2)
const RULE_METRIC: Record<string, { key: "costPerMsg" | "cpc" | "ctr" | "spend"; unit: "R$" | "%" | "" }> = {
  cpmsg: { key: "costPerMsg", unit: "R$" },
  cpc: { key: "cpc", unit: "R$" },
  ctr: { key: "ctr", unit: "%" },
  spend: { key: "spend", unit: "R$" },
}

function fmtVal(v: number, unit: string) {
  if (unit === "R$") return fmtCurrency(v)
  if (unit === "%") return `${v.toFixed(2)}%`
  return String(Math.round(v))
}

function ComputedAlerts({ rules }: { rules: Rule[] }) {
  const { range, account, accountName } = useFilters()
  const { data, isLoading } = useCampaigns(range, account)
  const campaigns = data?.campaigns ?? []

  const alerts = useMemo(() => {
    const active = rules.filter((r) => r.active)
    const out: {
      id: string; rule: string; campaign: string; account: string
      metricLabel: string; current: number; threshold: number; unit: string; operator: string
    }[] = []
    for (const r of active) {
      const m = RULE_METRIC[r.metric]
      if (!m) continue
      const scoped = campaigns.filter((c) => {
        if (r.scope === "all") return true
        // scope guarda o id da conta; comparamos pelo nome resolvido
        return c.account === accountName(r.scope) || c.account === r.scope
      })
      for (const c of scoped) {
        const current = Number((c as Record<string, number>)[m.key] ?? 0)
        if (current <= 0) continue
        const breached = r.operator === ">" ? current > Number(r.threshold) : current < Number(r.threshold)
        if (breached) {
          out.push({
            id: `${r.id}-${c.id}`, rule: r.name, campaign: c.name, account: c.account,
            metricLabel: METRICS[r.metric] ?? r.metric, current, threshold: Number(r.threshold),
            unit: m.unit, operator: r.operator,
          })
        }
      }
    }
    return out.sort((a, b) => b.current - a.current).slice(0, 20)
  }, [rules, campaigns, accountName])

  if (isLoading) return <LoadingState label="Avaliando alertas reais..." />

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        {alerts.length > 0 ? <ShieldAlert className="size-4 text-warning" /> : <ShieldCheck className="size-4 text-success" />}
        <div>
          <CardTitle className="text-base">Alertas ativos</CardTitle>
          <CardDescription>
            {alerts.length > 0
              ? `${alerts.length} disparo(s) com base nas regras ativas e métricas reais do período`
              : "Nenhuma regra ativa foi disparada pelas métricas reais do período"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {rules.some((r) => r.active)
              ? "Tudo dentro dos limites definidos."
              : "Crie e ative regras para gerar alertas automáticos a partir dos dados reais."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-warning/30 bg-warning/5 p-2.5">
                <ShieldAlert className="size-4 shrink-0 text-warning" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.campaign}</p>
                  <p className="text-xs text-muted-foreground">{a.account} · regra: {a.rule}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-warning">{fmtVal(a.current, a.unit)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {a.metricLabel} {a.operator} {fmtVal(a.threshold, a.unit)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

const METRICS: Record<string, string> = {
  cpmsg: "Custo por mensagem",
  cpc: "CPC",
  ctr: "CTR",
  freq: "Frequência",
  spend: "Gasto",
}
const ACTIONS: Record<string, string> = {
  pause: "Pausar campanha",
  notify: "Notificar gestor",
  budget: "Reduzir orçamento",
}

function RulesInner() {
  const { rules, isLoading, error } = useRules()
  const { logs } = useAudit()
  const { connections } = useConnections()
  const { accounts } = useFilters()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    metric: "cpmsg", operator: ">", threshold: "6", scope: "all", action: "pause",
  })

  const primaryConn = connections.find((c) => c.uses_env_token) ?? connections[0]

  const create = async () => {
    setSaving(true)
    try {
      await createItem("rules", {
        connection_id: primaryConn?.id ?? null,
        name: `${METRICS[form.metric]} ${form.operator} ${form.threshold}`,
        metric: form.metric,
        operator: form.operator,
        threshold: Number(form.threshold),
        action: form.action,
        scope: form.scope,
        active: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const recent = logs.slice(0, 6)

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Regras configuradas</CardTitle>
            <CardDescription>{rules.length} regra(s) ativa(s) no banco</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {isLoading ? (
              <LoadingState label="Carregando regras..." />
            ) : error ? (
              <ErrorState message="Não foi possível carregar as regras." />
            ) : rules.length === 0 ? (
              <DataEmptyState
                icon={BellRing}
                title="Nenhuma regra criada"
                description="Crie regras de automação ao lado para monitorar métricas e disparar ações sobre as campanhas."
              />
            ) : (
              rules.map((r: Rule) => (
                <div key={r.id} className={cn(
                  "flex items-start gap-3 rounded-md border p-3",
                  r.active ? "border-border bg-secondary/30" : "border-border/50 bg-muted/30 opacity-70",
                )}>
                  <BellRing className={cn("mt-0.5 size-4 shrink-0", r.active ? "text-primary" : "text-muted-foreground")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {METRICS[r.metric] ?? r.metric} {r.operator} {r.threshold} ·{" "}
                      {r.scope === "all" ? "Todas as contas" : accounts.find((a) => a.id === r.scope)?.name ?? r.scope} ·{" "}
                      {ACTIONS[r.action] ?? r.action}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost" size="icon" className="size-7 text-muted-foreground"
                      aria-label={r.active ? "Desativar regra" : "Ativar regra"}
                      onClick={() => patchItem("rules", { id: r.id, active: !r.active })}
                    >
                      <Power className={cn("size-4", r.active && "text-success")} />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive"
                      aria-label="Excluir regra" onClick={() => deleteItem("rules", r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Builder de regras */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova regra</CardTitle>
            <CardDescription>Condição, escopo e ação</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Quando a métrica</Label>
              <Select value={form.metric} onValueChange={(v) => setForm({ ...form, metric: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(METRICS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Operador</Label>
                <Select value={form.operator} onValueChange={(v) => setForm({ ...form, operator: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">">Maior que</SelectItem>
                    <SelectItem value="<">Menor que</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Valor</Label>
                <Input type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} className="h-9" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Escopo</Label>
              <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Ação sugerida</Label>
              <Select value={form.action} onValueChange={(v) => setForm({ ...form, action: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIONS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="mt-1 gap-1.5" onClick={create} disabled={saving}>
              <Plus className="size-4" /> {saving ? "Criando..." : "Criar regra"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Histórico real (auditoria) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atividade recente</CardTitle>
          <CardDescription>Últimas operações registradas no painel</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sem atividade registrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center gap-3 text-sm">
                  <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  <p className="text-foreground">
                    <span className="font-medium">{e.actor}</span>{" "}
                    <span className="text-muted-foreground">{e.description}</span>
                  </p>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                    {new Date(e.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export function AlertsSection() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Alertas e automações</h2>
        <p className="text-sm text-muted-foreground">Regras operacionais vinculadas às conexões Meta ativas</p>
      </div>
      <ConnectionGate onGoToConnections={() => navigate("Integrações")}>
        <RulesInner />
      </ConnectionGate>
    </div>
  )
}
