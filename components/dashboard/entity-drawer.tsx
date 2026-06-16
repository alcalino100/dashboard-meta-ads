"use client"

import Image from "next/image"
import { Pause, Pencil } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"
import { fmtCurrency, fmtNumber, fmtPercent } from "@/lib/format"
import type { CampaignRow, AdSetRow, AdRow } from "@/lib/use-meta"

type Kind = "campaign" | "adset" | "ad"
type Row = CampaignRow | AdSetRow | AdRow

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

const KIND_LABEL: Record<Kind, string> = { campaign: "Campanha", adset: "Conjunto de anúncios", ad: "Anúncio" }

function buildMetrics(kind: Kind, row: Row) {
  const base = [
    { label: "Gasto", value: fmtCurrency(row.spend) },
    { label: "Impressões", value: fmtNumber(row.impressions) },
    { label: "Cliques", value: fmtNumber(row.clicks) },
    { label: "CPC", value: fmtCurrency(row.cpc) },
    { label: "CTR", value: fmtPercent(row.ctr) },
    { label: "Mensagens", value: fmtNumber(row.messages) },
    { label: "Custo/msg", value: row.messages > 0 ? fmtCurrency(row.costPerMsg) : "—" },
  ]
  return base
}

function buildInfo(kind: Kind, row: Row): { t: string; d: string }[] {
  if (kind === "campaign") {
    const c = row as CampaignRow
    return [
      { t: "Objetivo", d: c.objective },
      { t: "Orçamento", d: c.budget > 0 ? fmtCurrency(c.budget) : "Nível conjunto" },
      { t: "Início", d: c.start },
      { t: "Término", d: c.end },
      { t: "Atualização", d: c.updated },
    ]
  }
  if (kind === "adset") {
    const s = row as AdSetRow
    return [
      { t: "Otimização", d: s.optimization },
      { t: "Cobrança", d: s.billing },
      { t: "Posicionamentos", d: s.placements },
      { t: "Orçamento", d: s.budget > 0 ? fmtCurrency(s.budget) : "Nível campanha" },
      { t: "Início", d: s.start },
      { t: "Término", d: s.end },
    ]
  }
  return []
}

export function EntityDrawer({
  kind,
  row,
  accountId,
  open,
  onOpenChange,
}: {
  kind: Kind
  row: Row | null
  accountId?: string
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const ad = kind === "ad" ? (row as AdRow) : null
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {row && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <StatusBadge status={row.status} />
                <span className="text-xs text-muted-foreground">{KIND_LABEL[kind]}</span>
              </div>
              <SheetTitle className="text-balance text-left">{row.name}</SheetTitle>
              <SheetDescription className="text-left">
                ID {row.id}{accountId ? ` · ${accountId}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1.5">
                  <Pause className="size-3.5" /> Pausar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1.5">
                  <Pencil className="size-3.5" /> Editar
                </Button>
              </div>

              {ad && (ad.thumbnail || ad.body !== "—") && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    {ad.thumbnail && (
                      <Image
                        src={ad.thumbnail || "/placeholder.svg"}
                        alt={`Criativo de ${ad.name}`}
                        width={72}
                        height={72}
                        unoptimized
                        crossOrigin="anonymous"
                        className="size-[72px] shrink-0 rounded-md border border-border object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{ad.title}</p>
                      {ad.body !== "—" && <p className="mt-0.5 line-clamp-4 text-xs text-muted-foreground">{ad.body}</p>}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Métricas do período
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {buildMetrics(kind, row).map((m) => (
                    <Metric key={m.label} label={m.label} value={m.value} />
                  ))}
                </div>
              </div>

              {buildInfo(kind, row).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Informações
                    </p>
                    <ul className="flex flex-col gap-2">
                      {buildInfo(kind, row).map((h, i) => (
                        <li key={i} className="flex items-center justify-between gap-4 text-sm">
                          <span className="shrink-0 text-muted-foreground">{h.t}</span>
                          <span className="truncate text-right text-foreground">{h.d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
