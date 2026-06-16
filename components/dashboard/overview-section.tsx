"use client"

import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { KpiCards } from "./kpi-cards"
import { OverviewCharts } from "./overview-charts"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useOverview, type Range } from "@/lib/use-meta"

export function OverviewSection() {
  const [range, setRange] = useState<Range>("last_30d")
  const { data, error, isLoading } = useOverview(range)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Visão geral</h2>
          <p className="text-sm text-muted-foreground">
            Performance consolidada das contas Meta Ads
            {data ? ` · ${data.accountsConsidered} conta(s) com gasto` : ""}
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-border p-0.5">
          {(["last_7d", "last_30d"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r === "last_7d" ? "7 dias" : "30 dias"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card className="flex items-center gap-3 border-destructive/30 p-4 text-sm text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          <span>Erro ao carregar dados da Meta: {error.message}</span>
        </Card>
      )}

      {isLoading && !data && (
        <Card className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando dados reais da Meta Ads...
        </Card>
      )}

      {data && (
        <>
          <KpiCards totals={data.totals} />
          <OverviewCharts trend={data.trend} accountShare={data.accountShare} />
        </>
      )}
    </div>
  )
}
