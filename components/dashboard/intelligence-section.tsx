"use client"

import { useMemo } from "react"
import { Trophy, AlertOctagon, Sparkles, BarChart3 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { fmtCurrency } from "@/lib/format"
import { useCampaigns, type CampaignRow } from "@/lib/use-meta"
import { useFilters } from "@/lib/filters-context"
import { useNavigate } from "@/lib/nav-context"
import { ConnectionGate, LoadingState, ErrorState, DataEmptyState } from "./states"

function RankList({ data, best }: { data: CampaignRow[]; best: boolean }) {
  return (
    <ol className="flex flex-col gap-2">
      {data.map((c, i) => (
        <li key={c.id} className="flex items-center gap-3 rounded-md border border-border p-2.5">
          <span className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            best ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}>{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.account}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums text-foreground">{fmtCurrency(c.costPerMsg)}</p>
            <p className="text-xs text-muted-foreground">por msg</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function IntelligenceInner() {
  const { range, account } = useFilters()
  const { data, isLoading, error } = useCampaigns(range, account)
  const campaigns = data?.campaigns ?? []

  const withMsg = useMemo(
    () => campaigns.filter((c) => c.messages > 0 && c.costPerMsg > 0).sort((a, b) => a.costPerMsg - b.costPerMsg),
    [campaigns],
  )
  const best = withMsg.slice(0, 5)
  const worst = [...withMsg].reverse().slice(0, 5)

  // Eficiência por conta (custo médio por mensagem real)
  const byAccount = useMemo(() => {
    const map = new Map<string, { spend: number; messages: number }>()
    for (const c of campaigns) {
      const cur = map.get(c.account) ?? { spend: 0, messages: 0 }
      cur.spend += c.spend
      cur.messages += c.messages
      map.set(c.account, cur)
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, costPerMsg: v.messages > 0 ? v.spend / v.messages : 0, spend: v.spend }))
      .filter((a) => a.spend > 0)
      .sort((a, b) => b.spend - a.spend)
  }, [campaigns])

  // Insights computados a partir de dados reais
  const insights = useMemo(() => {
    const out: string[] = []
    if (best[0]) out.push(`"${best[0].name}" tem o menor custo por mensagem: ${fmtCurrency(best[0].costPerMsg)}.`)
    if (worst[0] && worst[0].id !== best[0]?.id)
      out.push(`"${worst[0].name}" está com o maior custo por mensagem: ${fmtCurrency(worst[0].costPerMsg)}.`)
    if (byAccount[0]) {
      const totalSpend = byAccount.reduce((s, a) => s + a.spend, 0)
      const share = totalSpend > 0 ? Math.round((byAccount[0].spend / totalSpend) * 100) : 0
      out.push(`${byAccount[0].name} concentra ${share}% do gasto no período selecionado.`)
    }
    return out
  }, [best, worst, byAccount])

  if (isLoading) return <LoadingState label="Analisando campanhas reais..." />
  if (error) return <ErrorState message="Não foi possível carregar a inteligência." />
  if (campaigns.length === 0)
    return (
      <DataEmptyState
        icon={BarChart3}
        title="Sem campanhas no período"
        description="Ajuste o período ou a conta nos filtros do topo para gerar rankings e insights com dados reais."
      />
    )

  const maxCpm = Math.max(...byAccount.map((a) => a.costPerMsg), 0.01)

  return (
    <>
      {insights.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {insights.map((text, i) => (
            <Card key={i} className="p-0">
              <CardContent className="flex gap-2.5 p-4">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {withMsg.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Trophy className="size-4 text-success" />
              <div>
                <CardTitle className="text-base">Melhores campanhas</CardTitle>
                <CardDescription>Menor custo por mensagem (real)</CardDescription>
              </div>
            </CardHeader>
            <CardContent><RankList data={best} best /></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <AlertOctagon className="size-4 text-destructive" />
              <div>
                <CardTitle className="text-base">Piores campanhas</CardTitle>
                <CardDescription>Maior custo por mensagem (real)</CardDescription>
              </div>
            </CardHeader>
            <CardContent><RankList data={worst} best={false} /></CardContent>
          </Card>
        </div>
      ) : (
        <DataEmptyState
          icon={Trophy}
          title="Sem campanhas de mensagens"
          description="As campanhas do período não registraram mensagens iniciadas, então não há ranking de custo por mensagem."
        />
      )}

      {byAccount.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eficiência por conta</CardTitle>
            <CardDescription>Custo médio por mensagem e gasto no período</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {byAccount.map((a) => (
              <div key={a.name} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm text-foreground">{a.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((a.costPerMsg / maxCpm) * 100, 3)}%` }} />
                </div>
                <span className="w-24 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
                  {a.costPerMsg > 0 ? `${fmtCurrency(a.costPerMsg)}/msg` : "—"}
                </span>
                <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:inline">{fmtCurrency(a.spend)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  )
}

export function IntelligenceSection() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Centro de inteligência</h2>
        <p className="text-sm text-muted-foreground">Rankings e eficiência calculados a partir das campanhas reais</p>
      </div>
      <ConnectionGate onGoToConnections={() => navigate("Integrações")}>
        <IntelligenceInner />
      </ConnectionGate>
    </div>
  )
}
