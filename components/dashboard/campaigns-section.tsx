"use client"

import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { NewCampaignModal } from "./new-campaign-modal"
import { CampaignsTable } from "./campaigns-table"
import { Card } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useCampaigns, type Range } from "@/lib/use-meta"

export function CampaignsSection() {
  const [range, setRange] = useState<Range>("last_30d")
  const [account, setAccount] = useState<string | undefined>(undefined)
  const { data, error, isLoading } = useCampaigns(range, account)

  const accounts = data?.accounts ?? []
  const currentAccount = account ?? data?.accountId

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Análise de campanhas</h2>
          <p className="text-sm text-muted-foreground">Dados reais da Meta Ads por conta de anúncio</p>
        </div>
        <NewCampaignModal />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={currentAccount} onValueChange={(v) => setAccount(v)}>
          <SelectTrigger aria-label="Conta de anúncio" className="h-9 w-auto min-w-[200px] border-border bg-secondary/40">
            <SelectValue placeholder="Selecione a conta" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <span>Erro ao carregar campanhas: {error.message}</span>
        </Card>
      )}

      {isLoading && !data && (
        <Card className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando campanhas reais...
        </Card>
      )}

      {data && <CampaignsTable campaigns={data.campaigns} />}
    </div>
  )
}
