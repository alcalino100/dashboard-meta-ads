"use client"

import { useState } from "react"
import Image from "next/image"
import { Pause, Play, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { StatusBadge } from "./status-badge"
import { fmtCurrency, fmtNumber, fmtPercent } from "@/lib/format"
import type { CampaignRow, AdSetRow, AdRow } from "@/lib/use-meta"

type Kind = "campaign" | "adset" | "ad"
type Row = CampaignRow | AdSetRow | AdRow

const ENDPOINT_MAP: Record<Kind, string> = {
  campaign: "campaigns",
  adset: "adsets",
  ad: "ads",
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

const KIND_LABEL: Record<Kind, string> = { campaign: "Campanha", adset: "Conjunto de anúncios", ad: "Anúncio" }

function buildMetrics(kind: Kind, row: Row) {
  return [
    { label: "Gasto", value: fmtCurrency(row.spend) },
    { label: "Impressões", value: fmtNumber(row.impressions) },
    { label: "Cliques", value: fmtNumber(row.clicks) },
    { label: "CPC", value: fmtCurrency(row.cpc) },
    { label: "CTR", value: fmtPercent(row.ctr) },
    { label: "Mensagens", value: fmtNumber(row.messages) },
    { label: "Custo/msg", value: row.messages > 0 ? fmtCurrency(row.costPerMsg) : "—" },
  ]
}

function buildInfo(kind: Kind, row: Row): { t: string; d: string }[] {
  if (kind === "campaign") {
    const c = row as CampaignRow
    return [
      { t: "Objetivo", d: c.objective },
      { t: "Orçamento", d: c.budget > 0 ? fmtCurrency(c.budget) : "Nível conjunto" },
      { t: "Início", d: c.start },
      { t: "Término", d: c.end },
      { t: "Atualização", d: c.updated },
    ]
  }
  if (kind === "adset") {
    const s = row as AdSetRow
    return [
      { t: "Otimização", d: s.optimization },
      { t: "Cobrança", d: s.billing },
      { t: "Posicionamentos", d: s.placements },
      { t: "Orçamento", d: s.budget > 0 ? fmtCurrency(s.budget) : "Nível campanha" },
      { t: "Início", d: s.start },
      { t: "Término", d: s.end },
    ]
  }
  return []
}

export function EntityDrawer({
  kind,
  row,
  accountId,
  open,
  onOpenChange,
  onMutate,
}: {
  kind: Kind
  row: Row | null
  accountId?: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onMutate?: () => void
}) {
  const [loading, setLoading] = useState<"toggle" | "delete" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [localStatus, setLocalStatus] = useState<Row["status"] | null>(null)

  const ad = kind === "ad" ? (row as AdRow) : null
  const currentStatus = localStatus ?? row?.status
  const isPaused = currentStatus === "paused"
  const endpoint = ENDPOINT_MAP[kind]

  const handleToggle = async () => {
    if (!row) return
    setLoading("toggle")
    setError(null)
    const newStatus = isPaused ? "ACTIVE" : "PAUSED"
    try {
      const res = await fetch(`/api/meta/${endpoint}/${row.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? "Erro ao atualizar status")
      setLocalStatus(newStatus === "ACTIVE" ? "active" : "paused")
      onMutate?.()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!row) return
    setLoading("delete")
    setError(null)
    try {
      const res = await fetch(`/api/meta/${endpoint}/${row.id}/delete`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? "Erro ao arquivar")
      onMutate?.()
      onOpenChange(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(null)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (!o) setLocalStatus(null); onOpenChange(o) }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {row && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <StatusBadge status={currentStatus ?? row.status} />
                  <span className="text-xs text-muted-foreground">{KIND_LABEL[kind]}</span>
                </div>
                <SheetTitle className="text-balance text-left">{row.name}</SheetTitle>
                <SheetDescription className="text-left">
                  ID {row.id}{accountId ? ` · ${accountId}` : ""}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-4 px-4 pb-6">
                {/* Ações operacionais */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={handleToggle}
                    disabled={!!loading}
                    aria-label={isPaused ? "Ativar" : "Pausar"}
                  >
                    {loading === "toggle" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : isPaused ? (
                      <Play className="size-3.5" />
                    ) : (
                      <Pause className="size-3.5" />
                    )}
                    {isPaused ? "Ativar" : "Pausar"}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" disabled={!!loading}>
                    <Pencil className="size-3.5" /> Editar
                  </Button>
                  {kind !== "ad" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirmDelete(true)}
                      disabled={!!loading}
                      aria-label="Arquivar"
                    >
                      {loading === "delete" ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Erro inline */}
                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {ad && (ad.thumbnail || ad.body !== "—") && (
                  <>
                    <Separator />
                    <div className="flex gap-3">
                      {ad.thumbnail && (
                        <Image
                          src={ad.thumbnail || "/placeholder.svg"}
                          alt={`Criativo de ${ad.name}`}
                          width={72}
                          height={72}
                          unoptimized
                          crossOrigin="anonymous"
                          className="size-[72px] shrink-0 rounded-md border border-border object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{ad.title}</p>
                        {ad.body !== "—" && <p className="mt-0.5 line-clamp-4 text-xs text-muted-foreground">{ad.body}</p>}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Métricas do período
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {buildMetrics(kind, row).map((m) => (
                      <Metric key={m.label} label={m.label} value={m.value} />
                    ))}
                  </div>
                </div>

                {buildInfo(kind, row).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Informações
                      </p>
                      <ul className="flex flex-col gap-2">
                        {buildInfo(kind, row).map((h, i) => (
                          <li key={i} className="flex items-center justify-between gap-4 text-sm">
                            <span className="shrink-0 text-muted-foreground">{h.t}</span>
                            <span className="truncate text-right text-foreground">{h.d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmação de arquivamento */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar {KIND_LABEL[kind].toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{row?.name}</strong> será arquivada na Meta e não aparecerá mais neste painel. Esta ação não é permanente — você pode restaurar pela interface da Meta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading === "delete"}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading === "delete"}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading === "delete" ? <Loader2 className="size-4 animate-spin" /> : "Sim, arquivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
