import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { kpis } from "@/lib/mock-data"
import { fmtByType, deltaPct } from "@/lib/format"

export function KpiCards() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((k) => {
        const delta = deltaPct(k.value, k.prev)
        const invert = "invert" in k && k.invert
        // para métricas "invert" (CPC, CPM, custo/msg), queda é positiva
        const isGood = invert ? delta < 0 : delta > 0
        const Icon = delta >= 0 ? ArrowUpRight : ArrowDownRight
        return (
          <Card key={k.key} className="gap-2 p-4">
            <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
            <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-card-foreground">
              {fmtByType(k.value, k.format)}
            </p>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums",
                  isGood ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                )}
              >
                <Icon className="size-3" />
                {Math.abs(delta).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
              </span>
              <span className="text-xs text-muted-foreground">vs período anterior</span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
