import { Card } from "@/components/ui/card"
import { fmtByType } from "@/lib/format"
import type { Totals } from "@/lib/use-meta"

type Format = "currency" | "number" | "percent"

export function KpiCards({ totals }: { totals: Totals }) {
  const items: { label: string; value: number; format: Format }[] = [
    { label: "Gasto", value: totals.spend, format: "currency" },
    { label: "Impressões", value: totals.impressions, format: "number" },
    { label: "Cliques no link", value: totals.linkClicks, format: "number" },
    { label: "CPC", value: totals.cpc, format: "currency" },
    { label: "CPM", value: totals.cpm, format: "currency" },
    { label: "CTR", value: totals.ctr, format: "percent" },
    { label: "Mensagens iniciadas", value: totals.messages, format: "number" },
    { label: "Custo por mensagem", value: totals.costPerMsg, format: "currency" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((k) => (
        <Card key={k.label} className="gap-2 p-4">
          <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
          <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-card-foreground">
            {fmtByType(k.value, k.format)}
          </p>
          <p className="text-xs text-muted-foreground">Período selecionado</p>
        </Card>
      ))}
    </div>
  )
}
