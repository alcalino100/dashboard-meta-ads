"use client"

import { Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ConnectionGate } from "./states"
import { useNavigate } from "@/lib/nav-context"
import { useFilters } from "@/lib/filters-context"

export function PlaceholderSection({ title }: { title: string }) {
  const navigate = useNavigate()
  const { accountName, account } = useFilters()
  const scope = account === "all" ? "todas as contas" : accountName(account)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">Escopo atual: {scope}</p>
      </div>
      <ConnectionGate onGoToConnections={() => navigate("Integrações")}>
        <Card className="items-center gap-4 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Sparkles className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Módulo em preparação</p>
            <p className="mx-auto mt-1 max-w-sm text-pretty text-sm text-muted-foreground">
              Sua conexão Meta está ativa. Este módulo consumirá os mesmos filtros globais de conta e período
              assim que estiver disponível.
            </p>
          </div>
        </Card>
      </ConnectionGate>
    </div>
  )
}
