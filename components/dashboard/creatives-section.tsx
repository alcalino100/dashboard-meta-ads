"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Trophy, ArrowDownWideNarrow } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useFilters } from "@/lib/filters-context"
import { useNavigate } from "@/lib/nav-context"
import { useCreatives, type CreativeSort } from "@/lib/use-meta"
import { fmtCurrency, fmtNumber, fmtPercent } from "@/lib/format"
import { ConnectionGate, ErrorState, LoadingState } from "./states"
import { cn } from "@/lib/utils"

const SORTS: { id: CreativeSort; label: string }[] = [
  { id: "messages", label: "Mais resultados" },
  { id: "spend", label: "Maior gasto" },
  { id: "costPerMsg", label: "Menor custo/msg" },
  { id: "ctr", label: "Maior CTR" },
]

export function CreativesSection() {
  const { range, account, rangeLabel } = useFilters()
  const navigate = useNavigate()
  const [sort, setSort] = useState<CreativeSort>("messages")
  const [campaignFilter, setCampaignFilter] = useState("all")

  const { data, error, isLoading, mutate } = useCreatives(range, account, sort, 24)

  const campaigns = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of data?.creatives ?? []) {
      if (c.campaignId) m.set(c.campaignId, c.campaignName ?? c.campaignId)
    }
    return [...m.entries()]
  }, [data])

  const rows = useMemo(() => {
    const list = data?.creatives ?? []
    if (campaignFilter === "all") return list
    return list.filter((c) => c.campaignId === campaignFilter)
  }, [data, campaignFilter])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Trophy className="size-5 text-primary" /> Criativos com melhor resultado
          </h2>
          <p className="text-sm text-muted-foreground">
            {rangeLabel} · por campanha e conjunto — thumbnail + gasto + mensagens + CTR
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            aria-label="Filtrar por campanha"
          >
            <option value="all">Todas as campanhas</option>
            {campaigns.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 rounded-md border border-border p-1">
            <ArrowDownWideNarrow className="ml-1 size-4 text-muted-foreground" />
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  sort === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ConnectionGate onGoToConnections={() => navigate("Integrações")}>
        {error ? (
          <ErrorState message={`Erro ao carregar criativos: ${error.message}`} onRetry={() => mutate()} />
        ) : isLoading && !data ? (
          <LoadingState label="Carregando ranking de criativos..." />
        ) : rows.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-sm font-medium text-foreground">Nenhum criativo no período</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Troque o período ou a conta — o ranking considera anúncios com entrega no intervalo selecionado.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((c, i) => (
              <Card key={c.id} className="gap-0 overflow-hidden p-0">
                <div className="relative h-40 w-full bg-muted">
                  {c.thumbnail ? (
                    <Image
                      src={c.thumbnail}
                      alt={`Criativo de ${c.name}`}
                      fill
                      unoptimized
                      crossOrigin="anonymous"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      sem preview
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                    #{i + 1} · {fmtNumber(c.messages)} msgs
                  </span>
                </div>
                <CardContent className="flex flex-col gap-1.5 p-4">
                  <p className="truncate text-sm font-semibold text-foreground" title={c.title}>{c.title}</p>
                  <p className="truncate text-xs text-muted-foreground" title={c.campaignName}>
                    📁 {c.campaignName ?? c.campaignId}
                  </p>
                  <p className="truncate text-xs text-muted-foreground" title={c.adsetName}>
                    📂 {c.adsetName ?? c.adsetId}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="rounded-md border border-border bg-secondary/30 p-2 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Gasto</p>
                      <p className="font-mono text-sm font-semibold tabular-nums">{fmtCurrency(c.spend)}</p>
                    </div>
                    <div className="rounded-md border border-border bg-secondary/30 p-2 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Custo/msg</p>
                      <p className="font-mono text-sm font-semibold tabular-nums">
                        {c.messages > 0 ? fmtCurrency(c.costPerMsg) : "—"}
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-secondary/30 p-2 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">CTR</p>
                      <p className="font-mono text-sm font-semibold tabular-nums">{fmtPercent(c.ctr)}</p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    {fmtNumber(c.impressions)} impr. · {fmtNumber(c.clicks)} cliques
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ConnectionGate>
    </div>
  )
}
