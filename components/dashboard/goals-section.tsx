"use client"

import { Plus, TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { goals } from "@/lib/mock-data"

function fmt(v: number, unit: string) {
  if (unit === "R$") return `R$ ${v.toFixed(2).replace(".", ",")}`
  if (unit === "%") return `${v.toFixed(2).replace(".", ",")}%`
  return String(v)
}

export function GoalsSection() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Metas por conta</h2>
          <p className="text-sm text-muted-foreground">Comparação entre meta e realizado por objetivo</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus className="size-4" /> Nova meta</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((g) => {
          // dir "down": menor é melhor (custo). dir "up": maior é melhor.
          const ratio = g.dir === "down" ? g.target / g.current : g.current / g.target
          const onTrack = ratio >= 1
          const pct = Math.min(Math.round((g.dir === "down" ? g.target / g.current : g.current / g.target) * 100), 130)
          const Icon = g.dir === "down" ? TrendingDown : TrendingUp
          return (
            <Card key={g.account + g.objective} className="p-0">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-foreground">{g.objective}</p>
                    <p className="text-xs text-muted-foreground">{g.account}</p>
                  </div>
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                    onTrack ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
                  )}>
                    <Icon className="size-3.5" /> {onTrack ? "No alvo" : "Estourando"}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Realizado</p>
                    <p className="text-xl font-semibold tabular-nums text-foreground">{fmt(g.current, g.unit)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Meta</p>
                    <p className="text-sm font-medium tabular-nums text-muted-foreground">{fmt(g.target, g.unit)}</p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full transition-all", onTrack ? "bg-success" : "bg-warning")}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
