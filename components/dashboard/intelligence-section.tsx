"use client"

import { Lightbulb, Plug, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useStatus } from "@/lib/use-meta"

type Priority = "Alta" | "Média" | "Baixa"

const priorityConfig: Record<Priority, { cls: string; dot: string }> = {
  Alta: { cls: "bg-destructive/15 text-destructive border-destructive/20", dot: "bg-destructive" },
  Média: { cls: "bg-warning/15 text-warning border-warning/20", dot: "bg-warning" },
  Baixa: { cls: "bg-secondary text-secondary-foreground border-border", dot: "bg-muted-foreground" },
}

type Rec = {
  id: string
  title: string
  account: string
  priority: Priority
  trend: "up" | "down" | "neutral"
}

// Recomendações reais — geradas a partir dos dados da Meta API
// Este array é preenchido dinamicamente quando há conexão ativa
const REAL_RECS: Rec[] = []

function TrendIcon({ trend }: { trend: Rec["trend"] }) {
  if (trend === "up") return <TrendingUp className="size-3.5 text-success" />
  if (trend === "down") return <TrendingDown className="size-3.5 text-destructive" />
  return <Minus className="size-3.5 text-muted-foreground" />
}

function EmptyState({ onGoToIntegrations }: { onGoToIntegrations?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted/40">
        <Plug className="size-6 text-muted-foreground" />
      </div>
      <div className="max-w-sm">
        <p className="text-base font-semibold text-foreground">Nenhuma conta conectada</p>
        <p className="mt-1 text-sm text-muted-foreground">
          As recomendações de inteligência são geradas exclusivamente a partir dos seus dados reais do Meta Ads.
          Conecte pelo menos uma conta para começar a receber insights personalizados.
        </p>
      </div>
      <Button
        variant="outline"
        className="gap-2"
        onClick={onGoToIntegrations}
      >
        <Plug className="size-4" />
        Ir para Integrações
        <ArrowRight className="size-4" />
      </Button>
      <div className="mt-2 grid max-w-md gap-2 text-left">
        {[
          "Anomalias de gasto e entrega em tempo real",
          "Campanhas com custo por resultado acima da meta",
          "Públicos saturados e criativos com queda de performance",
          "Oportunidades de escala por CTR e ROAS",
          "Comparativo de performance entre contas gerenciadas",
        ].map((item) => (
          <div key={item} className="flex items-start gap-2 rounded-md border border-border bg-muted/20 px-3 py-2">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function NoDataYet() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Lightbulb className="size-8 text-muted-foreground/40" />
      <div className="max-w-sm">
        <p className="text-sm font-medium text-foreground">Processando dados das contas</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Conta conectada com sucesso. As recomendações aparecerão aqui após a primeira sincronização de dados.
        </p>
      </div>
    </div>
  )
}

function RecList({ recs }: { recs: Rec[] }) {
  return (
    <div className="flex flex-col gap-2">
      {recs.map((r) => {
        const cfg = priorityConfig[r.priority]
        return (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className={cn("mt-1 size-2 shrink-0 rounded-full", cfg.dot)} />
              <div className="min-w-0">
                <p className="text-sm text-foreground">{r.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.account}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <TrendIcon trend={r.trend} />
              <span className={cn("inline-block rounded border px-2 py-0.5 text-xs font-medium", cfg.cls)}>
                {r.priority}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function IntelligenceSection({ onGoToIntegrations }: { onGoToIntegrations?: () => void }) {
  const { data: status, isLoading } = useStatus()
  // Só considera conectado se a API retornou connected: true explicitamente
  const connected = status?.connected === true

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Inteligência</h2>
        <p className="text-sm text-muted-foreground">Recomendações geradas a partir dos dados reais das suas contas</p>
      </div>

      <Card className="p-0">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex flex-col gap-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !connected ? (
            // Sem conta conectada: sempre mostra empty state — NUNCA dados mock
            <EmptyState onGoToIntegrations={onGoToIntegrations} />
          ) : REAL_RECS.length === 0 ? (
            // Conectado mas ainda sem dados processados
            <NoDataYet />
          ) : (
            // Conectado com recomendações reais disponíveis
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Recomendações priorizadas</p>
                <span className="ml-auto text-xs text-muted-foreground">Ações sugeridas por prioridade</span>
              </div>
              <RecList recs={REAL_RECS} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
