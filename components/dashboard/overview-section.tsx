import { KpiCards } from "./kpi-cards"
import { OverviewCharts } from "./overview-charts"

export function OverviewSection() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Visão geral</h2>
        <p className="text-sm text-muted-foreground">Performance consolidada das contas Meta Ads</p>
      </div>
      <KpiCards />
      <OverviewCharts />
    </div>
  )
}
