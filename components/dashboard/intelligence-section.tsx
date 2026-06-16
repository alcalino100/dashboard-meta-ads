"use client"

import { Trophy, AlertOctagon, Sparkles, Lightbulb } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ranking, heatmap, recommendations, insights } from "@/lib/mock-data"
import { fmtCurrency } from "@/lib/format"
import { ConnectionGate } from "./states"
import { useNavigate } from "@/lib/nav-context"

const best = ranking.slice(0, 5)
const worst = [...ranking].reverse().slice(0, 5)

const prioCfg = {
  high: { label: "Alta", cls: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
  medium: { label: "Média", cls: "bg-warning/15 text-warning", dot: "bg-warning" },
  low: { label: "Baixa", cls: "bg-secondary text-secondary-foreground", dot: "bg-muted-foreground" },
}

function heatColor(score: number) {
  if (score >= 80) return "bg-success/80 text-background"
  if (score >= 60) return "bg-success/45 text-foreground"
  if (score >= 45) return "bg-warning/45 text-foreground"
  return "bg-destructive/40 text-foreground"
}

function RankList({ data, best }: { data: typeof ranking; best: boolean }) {
  return (
    <ol className="flex flex-col gap-2">
      {data.map((c, i) => (
        <li key={c.name} className="flex items-center gap-3 rounded-md border border-border p-2.5">
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

export function IntelligenceSection() {
  const navigate = useNavigate()
  const objectives = heatmap[0].values.map((v) => v.objective)
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Centro de inteligência</h2>
        <p className="text-sm text-muted-foreground">Rankings, eficiência por objetivo e recomendações priorizadas</p>
      </div>

      <ConnectionGate onGoToConnections={() => navigate("Integrações")}>
      {/* Insights automáticos */}
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

      {/* Rankings */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Trophy className="size-4 text-success" />
            <div>
              <CardTitle className="text-base">Melhores campanhas</CardTitle>
              <CardDescription>Menor custo por mensagem</CardDescription>
            </div>
          </CardHeader>
          <CardContent><RankList data={best} best /></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <AlertOctagon className="size-4 text-destructive" />
            <div>
              <CardTitle className="text-base">Piores campanhas</CardTitle>
              <CardDescription>Maior custo por mensagem</CardDescription>
            </div>
          </CardHeader>
          <CardContent><RankList data={worst} best={false} /></CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Heatmap de eficiência</CardTitle>
          <CardDescription>Score por conta e objetivo (0–100)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              <div className="grid grid-cols-[140px_repeat(5,1fr)] gap-1.5">
                <div />
                {objectives.map((o) => (
                  <div key={o} className="px-1 pb-1 text-center text-xs font-medium text-muted-foreground">{o}</div>
                ))}
                {heatmap.map((row) => (
                  <div key={row.account} className="contents">
                    <div className="flex items-center text-sm font-medium text-foreground">{row.account}</div>
                    {row.values.map((v) => (
                      <div
                        key={v.objective}
                        className={cn("flex h-12 items-center justify-center rounded-md text-sm font-semibold tabular-nums", heatColor(v.score))}
                        title={`${row.account} · ${v.objective}: ${v.score}`}
                      >
                        {v.score}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Lightbulb className="size-4 text-warning" />
          <div>
            <CardTitle className="text-base">Recomendações priorizadas</CardTitle>
            <CardDescription>Ações sugeridas por prioridade</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {recommendations.map((r) => {
            const cfg = prioCfg[r.priority]
            return (
              <div key={r.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", cfg.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{r.text}</p>
                  <p className="text-xs text-muted-foreground">{r.account}</p>
                </div>
                <span className={cn("shrink-0 rounded px-2 py-0.5 text-xs font-medium", cfg.cls)}>{cfg.label}</span>
              </div>
            )
          })}
        </CardContent>
      </Card>
      </ConnectionGate>
    </div>
  )
}
