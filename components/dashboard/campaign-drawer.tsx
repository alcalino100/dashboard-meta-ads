"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Pause, Copy, Pencil } from "lucide-react"
import { StatusBadge } from "./status-badge"
import type { Campaign } from "@/lib/mock-data"
import { fmtCurrency, fmtNumber, fmtPercent } from "@/lib/format"

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

export function CampaignDrawer({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: Campaign | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {campaign && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <StatusBadge status={campaign.status} />
                <span className="text-xs text-muted-foreground">{campaign.objective}</span>
              </div>
              <SheetTitle className="text-balance text-left">{campaign.name}</SheetTitle>
              <SheetDescription className="text-left">
                {campaign.account} · {campaign.id} · Responsável: {campaign.owner}
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
                <Button size="sm" variant="outline" className="flex-1 gap-1.5">
                  <Copy className="size-3.5" /> Duplicar
                </Button>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Métricas do período
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Gasto" value={fmtCurrency(campaign.spend)} />
                  <Metric label="Orçamento" value={fmtCurrency(campaign.budget)} />
                  <Metric label="Impressões" value={fmtNumber(campaign.impressions)} />
                  <Metric label="Cliques" value={fmtNumber(campaign.clicks)} />
                  <Metric label="CPC" value={fmtCurrency(campaign.cpc)} />
                  <Metric label="CTR" value={fmtPercent(campaign.ctr)} />
                  <Metric label="Mensagens" value={fmtNumber(campaign.messages)} />
                  <Metric label="Custo/msg" value={fmtCurrency(campaign.costPerMsg)} />
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Histórico recente
                </p>
                <ul className="flex flex-col gap-2">
                  {[
                    { t: `Atualizado ${campaign.updated}`, d: "Sincronização de métricas" },
                    { t: "Ontem", d: "Orçamento ajustado para " + fmtCurrency(campaign.budget) },
                    { t: "2 dias atrás", d: "Criativo substituído" },
                    { t: campaign.start, d: "Campanha iniciada" },
                  ].map((h, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <div>
                        <p className="text-foreground">{h.d}</p>
                        <p className="text-xs text-muted-foreground">{h.t}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
