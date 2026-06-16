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

// Apenas exibidas quando há conexão ativa com dados reais
const MOCK_RECS: Rec[] = [
  { id: "1", title: "Pausar 'Conversões Studio Remarketing' — sem entrega há 6h e gasto acelerado.", account: "Studio Bella", priority: "Alta", trend: "down" },
  { id: "2", title: "Revisar criativo de 'Mensagens Colucci Aquisição' — custo por mensagem 63% acima da meta.", account: "Colucci Joias", priority: "Alta", trend: "down" },
  { id: "3", title: "Realocar orçamento de Móveis Norte para campanhas com CTR acima de 1,8%.", account: "Móveis Norte", priority: "Média", trend: "up" },
  { id: "4", title: "Reduzir frequência em 'Alcance Vitta' — saturação de público em 7 dias.", account: "Clínica Vitta", priority: "Média", trend: "neutral" },
  { id: "5", title: "Testar novos públicos lookalike para escalar campanhas eficientes.", account: "Colucci Joias", priority: "Baixa", trend: "up" },
]

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
          As recomendações de inteligência são geradas a partir dos seus dados reais do Meta Ads.
          Conecte pelo menos uma conta para começar a receber insights.
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
            <EmptyState onGoToIntegrations={onGoToIntegrations} />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Recomendações priorizadas</p>
                <span className="ml-auto text-xs text-muted-foreground">Ações sugeridas por prioridade</span>
              </div>
              <RecList recs={MOCK_RECS} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
