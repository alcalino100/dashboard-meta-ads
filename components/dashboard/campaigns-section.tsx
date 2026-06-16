import { NewCampaignModal } from "./new-campaign-modal"
import { CampaignsTable } from "./campaigns-table"

export function CampaignsSection() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Análise de campanhas</h2>
          <p className="text-sm text-muted-foreground">Visão consolidada multi-conta com ações operacionais</p>
        </div>
        <NewCampaignModal />
      </div>
      <CampaignsTable />
    </div>
  )
}
