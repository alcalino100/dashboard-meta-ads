"use client"

import type { ReactNode } from "react"
import {
  PlugZap, Inbox, AlertTriangle, ShieldOff, RefreshCw, Loader2, type LucideIcon,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useFilters } from "@/lib/filters-context"

// ── Estado base ─────────────────────────────────────────────
function StateCard({
  icon: Icon,
  tone = "muted",
  title,
  description,
  action,
}: {
  icon: LucideIcon
  tone?: "muted" | "warning" | "destructive"
  title: string
  description: string
  action?: ReactNode
}) {
  const toneCls = {
    muted: "bg-secondary text-muted-foreground",
    warning: "border-warning/20 bg-warning/10 text-warning",
    destructive: "border-destructive/20 bg-destructive/10 text-destructive",
  }[tone]
  return (
    <Card className="items-center gap-4 p-12 text-center">
      <div className={`flex size-12 items-center justify-center rounded-full border ${toneCls}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-pretty text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </Card>
  )
}

// ── Sem conexão (CTA único, vai para Integrações) ───────────
export function NoConnectionState({ onGoToConnections }: { onGoToConnections?: () => void }) {
  return (
    <StateCard
      icon={PlugZap}
      tone="destructive"
      title="Nenhuma conexão Meta ativa"
      description="Conecte um Business Manager em Integrações para que este módulo exiba dados reais."
      action={
        onGoToConnections ? (
          <Button size="sm" className="gap-1.5" onClick={onGoToConnections}>
            <PlugZap className="size-4" /> Ir para Integrações
          </Button>
        ) : undefined
      }
    />
  )
}

// ── Sem dados por nível hierárquico ─────────────────────────
const LEVEL_COPY: Record<string, { title: string; desc: string }> = {
  account: { title: "Nenhuma conta disponível", desc: "O token conectado não tem contas de anúncio acessíveis." },
  campaign: { title: "Nenhuma campanha encontrada", desc: "Esta conta não tem campanhas no período selecionado." },
  adset: { title: "Nenhum conjunto encontrado", desc: "Não há conjuntos de anúncios para o filtro atual." },
  ad: { title: "Nenhum anúncio encontrado", desc: "Não há anúncios para o conjunto ou período selecionado." },
}

export function EmptyLevelState({ level }: { level: "account" | "campaign" | "adset" | "ad" }) {
  const c = LEVEL_COPY[level]
  return <StateCard icon={Inbox} title={c.title} description={c.desc} />
}

// ── Erro de API classificado ────────────────────────────────
export function ApiErrorState({
  message,
  code,
  onRetry,
}: {
  message: string
  code?: number | null
  onRetry?: () => void
}) {
  // 190 = token expirado/inválido · 10/200/3 = permissão insuficiente
  const isAuth = code === 190
  const isPerm = code === 10 || code === 200 || code === 3
  const cfg = isAuth
    ? { icon: RefreshCw, tone: "warning" as const, title: "Conexão expirada", desc: "O token da conexão expirou. Reconecte em Integrações para retomar a sincronização." }
    : isPerm
      ? { icon: ShieldOff, tone: "destructive" as const, title: "Permissão insuficiente", desc: "O token não possui os escopos necessários (ads_read/ads_management) para esta operação." }
      : { icon: AlertTriangle, tone: "destructive" as const, title: "Erro de sincronização", desc: message }
  return (
    <StateCard
      icon={cfg.icon}
      tone={cfg.tone}
      title={cfg.title}
      description={cfg.desc}
      action={
        onRetry ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onRetry}>
            <RefreshCw className="size-4" /> Tentar novamente
          </Button>
        ) : undefined
      }
    />
  )
}

// ── Skeletons ───────────────────────────────────────────────
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card className="gap-0 p-0">
      <div className="flex gap-4 border-b border-border p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-border/50 p-4">
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </Card>
  )
}

export function InlineLoading({ label = "Carregando dados reais..." }: { label?: string }) {
  return (
    <Card className="flex-row items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label}
    </Card>
  )
}

// ── Vazio com ação (listas sem itens) ───────────────────────
export function DataEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <StateCard
      icon={Icon}
      title={title}
      description={description}
      action={
        actionLabel && onAction ? (
          <Button size="sm" className="gap-1.5" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : undefined
      }
    />
  )
}

// Aliases simplificados usados pelos módulos
export function ErrorState({ message, code, onRetry }: { message: string; code?: number | null; onRetry?: () => void }) {
  return <ApiErrorState message={message} code={code} onRetry={onRetry} />
}

export function LoadingState({ label }: { label?: string }) {
  return <InlineLoading label={label} />
}

// ── Gate de conexão reutilizável ────────────────────────────
// Garante CTA único de conexão; quando conectado, renderiza children.
export function ConnectionGate({
  children,
  onGoToConnections,
}: {
  children: ReactNode
  onGoToConnections?: () => void
}) {
  const { connected, statusLoading } = useFilters()
  if (statusLoading) return <InlineLoading label="Verificando conexão Meta..." />
  if (!connected) return <NoConnectionState onGoToConnections={onGoToConnections} />
  return <>{children}</>
}
