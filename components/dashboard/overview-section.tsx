"use client"

import { KpiCards } from "./kpi-cards"
import { OverviewCharts } from "./overview-charts"
import { ConnectionGate, ErrorState, LoadingState } from "./states"
import { useFilters } from "@/lib/filters-context"
import { useNavigate } from "@/lib/nav-context"
import { useOverview } from "@/lib/use-meta"

export function OverviewSection() {
  const { range, account, rangeLabel } = useFilters()
  const navigate = useNavigate()
  const { data, error, isLoading, mutate } = useOverview(range, account)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Visão geral</h2>
          <p className="text-sm text-muted-foreground">
            {data?.client ? `Cliente: ${data.client.name} · ` : ""}
            {rangeLabel}
            {data ? ` · ${data.accountsConsidered} conta(s) com gasto` : ""}
          </p>
        </div>
        {data?.fetchedAt && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-success/20 bg-success/10 px-2 py-1 text-[11px] font-medium text-success">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            AO VIVO · {new Date(data.fetchedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>

      <ConnectionGate onGoToConnections={() => navigate("Integrações")}>
        {error ? (
          <ErrorState message={`Erro ao carregar dados da Meta: ${error.message}`} onRetry={() => mutate()} />
        ) : isLoading && !data ? (
          <LoadingState label="Carregando dados reais da Meta Ads..." />
        ) : data ? (
          <>
            <KpiCards totals={data.totals} />
            <OverviewCharts trend={data.trend} accountShare={data.accountShare} />
          </>
        ) : null}
      </ConnectionGate>
    </div>
  )
}
