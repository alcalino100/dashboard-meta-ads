"use client"

import { useState } from "react"
import { ChevronRight, Megaphone, Layers, ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFilters } from "@/lib/filters-context"
import { useNavigate } from "@/lib/nav-context"
import { useCampaigns, useAdSets, useAds, type CampaignRow, type AdSetRow, type AdRow } from "@/lib/use-meta"
import { HierarchyTable, type Column } from "./hierarchy-table"
import { EntityDrawer } from "./entity-drawer"
import { ConnectionGate, ErrorState } from "./states"
import { fmtCurrency, fmtNumber, fmtPercent } from "@/lib/format"

type Level = "campaign" | "adset" | "ad"

type Crumb = { id: string; name: string }

export function HierarchySection() {
  const { range, account } = useFilters()
  const navigate = useNavigate()

  const [level, setLevel] = useState<Level>("campaign")
  const [campaign, setCampaign] = useState<Crumb | null>(null)
  const [adset, setAdSet] = useState<Crumb | null>(null)
  const [detail, setDetail] = useState<{ kind: Level; row: CampaignRow | AdSetRow | AdRow } | null>(null)

  const campaignsQ = useCampaigns(range, account)
  const adsetsQ = useAdSets(range, account, campaign?.id, level === "adset")
  const adsQ = useAds(range, account, adset?.id, level === "ad")

  const accountId = campaignsQ.data?.accountId

  // Navegação descendente
  const openAdSets = (row: CampaignRow) => {
    setCampaign({ id: row.id, name: row.name })
    setAdSet(null)
    setLevel("adset")
  }
  const openAds = (row: AdSetRow) => {
    setAdSet({ id: row.id, name: row.name })
    setLevel("ad")
  }

  const goLevel = (l: Level) => {
    if (l === "campaign") {
      setCampaign(null)
      setAdSet(null)
    }
    if (l === "adset") setAdSet(null)
    setLevel(l)
  }

  const tabs: { key: Level; label: string; icon: typeof Megaphone; count?: number }[] = [
    { key: "campaign", label: "Campanhas", icon: Megaphone, count: campaignsQ.data?.campaigns.length },
    { key: "adset", label: "Conjuntos", icon: Layers, count: level === "adset" ? adsetsQ.data?.adsets.length : undefined },
    { key: "ad", label: "Anúncios", icon: ImageIcon, count: level === "ad" ? adsQ.data?.ads.length : undefined },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Gerenciador de campanhas</h2>
          <p className="text-sm text-muted-foreground">Navegue por campanhas, conjuntos e anúncios</p>
        </div>
      </div>

      <ConnectionGate onGoToConnections={() => navigate("Integrações")}>
        {/* Tabs de nível (estilo Ads Manager) */}
        <div className="flex items-center gap-1 border-b border-border">
          {tabs.map((t) => {
            const Icon = t.icon
            const disabled = (t.key === "adset" && !campaign) || (t.key === "ad" && !adset)
            return (
              <button
                key={t.key}
                onClick={() => !disabled && goLevel(t.key)}
                disabled={disabled}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  level === t.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                  disabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {t.label}
                {typeof t.count === "number" && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs tabular-nums text-secondary-foreground">
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Breadcrumbs */}
        {(campaign || adset) && (
          <nav aria-label="Trilha de navegação" className="flex flex-wrap items-center gap-1 text-sm">
            <button onClick={() => goLevel("campaign")} className="text-muted-foreground hover:text-foreground">
              Todas as campanhas
            </button>
            {campaign && (
              <>
                <ChevronRight className="size-3.5 text-muted-foreground" />
                <button
                  onClick={() => goLevel("adset")}
                  className={cn(level === "adset" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {campaign.name}
                </button>
              </>
            )}
            {adset && (
              <>
                <ChevronRight className="size-3.5 text-muted-foreground" />
                <span className="font-medium text-foreground">{adset.name}</span>
              </>
            )}
          </nav>
        )}

        {/* Conteúdo por nível */}
        {level === "campaign" && (
          campaignsQ.error ? (
            <ErrorState message="Não foi possível carregar as campanhas." onRetry={() => campaignsQ.mutate()} />
          ) : (
            <HierarchyTable<CampaignRow>
              loading={campaignsQ.isLoading}
              rows={campaignsQ.data?.campaigns ?? []}
              columns={campaignColumns}
              entityLabel="campanha"
              emptyLabel="Nenhuma campanha no período selecionado."
              onDrill={openAdSets}
              drillLabel="Ver conjuntos"
              onRowClick={(row) => setDetail({ kind: "campaign", row })}
            />
          )
        )}

        {level === "adset" && (
          adsetsQ.error ? (
            <ErrorState message="Não foi possível carregar os conjuntos." onRetry={() => adsetsQ.mutate()} />
          ) : (
            <HierarchyTable<AdSetRow>
              loading={adsetsQ.isLoading}
              rows={adsetsQ.data?.adsets ?? []}
              columns={adsetColumns}
              entityLabel="conjunto"
              emptyLabel="Nenhum conjunto nesta campanha."
              onDrill={openAds}
              drillLabel="Ver anúncios"
              onRowClick={(row) => setDetail({ kind: "adset", row })}
            />
          )
        )}

        {level === "ad" && (
          adsQ.error ? (
            <ErrorState message="Não foi possível carregar os anúncios." onRetry={() => adsQ.mutate()} />
          ) : (
            <HierarchyTable<AdRow>
              loading={adsQ.isLoading}
              rows={adsQ.data?.ads ?? []}
              columns={adColumns}
              entityLabel="anúncio"
              emptyLabel="Nenhum anúncio neste conjunto."
              onRowClick={(row) => setDetail({ kind: "ad", row })}
            />
          )
        )}
      </ConnectionGate>

      <EntityDrawer
        kind={detail?.kind ?? "campaign"}
        row={detail?.row ?? null}
        accountId={accountId}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
      />
    </div>
  )
}

const statusKey = "status" as const

const campaignColumns: Column<CampaignRow>[] = [
  { key: "name", label: "Campanha", sortable: true, primary: true },
  { key: statusKey, label: "Status", type: "status" },
  { key: "objective", label: "Objetivo" },
  { key: "spend", label: "Gasto", sortable: true, align: "right", fmt: (v) => fmtCurrency(v as number) },
  { key: "clicks", label: "Cliques", align: "right", fmt: (v) => fmtNumber(v as number) },
  { key: "cpc", label: "CPC", sortable: true, align: "right", fmt: (v) => fmtCurrency(v as number) },
  { key: "ctr", label: "CTR", sortable: true, align: "right", fmt: (v) => fmtPercent(v as number) },
  { key: "messages", label: "Msgs", sortable: true, align: "right", fmt: (v) => fmtNumber(v as number) },
  { key: "costPerMsg", label: "Custo/msg", sortable: true, align: "right", fmt: (v) => ((v as number) > 0 ? fmtCurrency(v as number) : "—") },
]

const adsetColumns: Column<AdSetRow>[] = [
  { key: "name", label: "Conjunto", sortable: true, primary: true },
  { key: statusKey, label: "Status", type: "status" },
  { key: "optimization", label: "Otimização" },
  { key: "spend", label: "Gasto", sortable: true, align: "right", fmt: (v) => fmtCurrency(v as number) },
  { key: "clicks", label: "Cliques", align: "right", fmt: (v) => fmtNumber(v as number) },
  { key: "cpc", label: "CPC", sortable: true, align: "right", fmt: (v) => fmtCurrency(v as number) },
  { key: "ctr", label: "CTR", sortable: true, align: "right", fmt: (v) => fmtPercent(v as number) },
  { key: "messages", label: "Msgs", sortable: true, align: "right", fmt: (v) => fmtNumber(v as number) },
  { key: "costPerMsg", label: "Custo/msg", sortable: true, align: "right", fmt: (v) => ((v as number) > 0 ? fmtCurrency(v as number) : "—") },
]

const adColumns: Column<AdRow>[] = [
  { key: "name", label: "Anúncio", sortable: true, primary: true },
  { key: statusKey, label: "Status", type: "status" },
  { key: "spend", label: "Gasto", sortable: true, align: "right", fmt: (v) => fmtCurrency(v as number) },
  { key: "impressions", label: "Impressões", align: "right", fmt: (v) => fmtNumber(v as number) },
  { key: "clicks", label: "Cliques", align: "right", fmt: (v) => fmtNumber(v as number) },
  { key: "cpc", label: "CPC", sortable: true, align: "right", fmt: (v) => fmtCurrency(v as number) },
  { key: "ctr", label: "CTR", sortable: true, align: "right", fmt: (v) => fmtPercent(v as number) },
  { key: "messages", label: "Msgs", sortable: true, align: "right", fmt: (v) => fmtNumber(v as number) },
]
