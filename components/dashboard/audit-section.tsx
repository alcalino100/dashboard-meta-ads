"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, PlugZap, Activity, FileClock, type LucideIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAudit } from "@/lib/use-store"
import { LoadingState, ErrorState } from "./states"

const actionCfg: Record<string, { icon: LucideIcon; label: string; cls: string; dot: string }> = {
  create: { icon: Plus, label: "Criação", cls: "text-success", dot: "bg-success" },
  update: { icon: Pencil, label: "Atualização", cls: "text-primary", dot: "bg-primary" },
  delete: { icon: Trash2, label: "Remoção", cls: "text-destructive", dot: "bg-destructive" },
  test_connection: { icon: PlugZap, label: "Teste de conexão", cls: "text-warning", dot: "bg-warning" },
}

function cfgFor(action: string) {
  return actionCfg[action] ?? { icon: Activity, label: action, cls: "text-muted-foreground", dot: "bg-muted-foreground" }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
  })
}

export function AuditSection() {
  const { logs, isLoading, error } = useAudit()
  const [actor, setActor] = useState("all")
  const [action, setAction] = useState("all")

  const actors = useMemo(() => Array.from(new Set(logs.map((l) => l.actor))), [logs])
  const actions = useMemo(() => Array.from(new Set(logs.map((l) => l.action))), [logs])

  const filtered = useMemo(
    () =>
      logs.filter(
        (l) => (actor === "all" || l.actor === actor) && (action === "all" || l.action === action),
      ),
    [logs, actor, action],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Auditoria</h2>
        <p className="text-sm text-muted-foreground">Registro real de ações realizadas no painel</p>
      </div>

      {isLoading ? (
        <LoadingState label="Carregando histórico..." />
      ) : error ? (
        <ErrorState message="Não foi possível carregar o histórico de auditoria." />
      ) : logs.length === 0 ? (
        <Card className="items-center gap-4 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border bg-secondary text-muted-foreground">
            <FileClock className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Nenhum evento registrado</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              As ações realizadas no painel (criar metas, convidar usuários, testar conexões) aparecerão aqui automaticamente.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 p-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Responsável</Label>
                <Select value={actor} onValueChange={setActor}>
                  <SelectTrigger className="h-9 w-44" aria-label="Filtrar por responsável"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {actors.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Ação</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger className="h-9 w-44" aria-label="Filtrar por ação"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {actions.map((a) => <SelectItem key={a} value={a}>{cfgFor(a).label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline de eventos</CardTitle>
              <CardDescription>{filtered.length} evento(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento corresponde aos filtros.</p>
              ) : (
                <ol className="relative flex flex-col gap-1 border-l border-border pl-5">
                  {filtered.map((log) => {
                    const cfg = cfgFor(log.action)
                    const Icon = cfg.icon
                    return (
                      <li key={log.id} className="relative flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                        <span className={cn("absolute -left-[1.6rem] flex size-3 items-center justify-center rounded-full ring-4 ring-card", cfg.dot)} />
                        <Icon className={cn("size-4 shrink-0", cfg.cls)} />
                        <span className="text-sm font-medium text-foreground">{log.actor}</span>
                        <span className="text-sm text-muted-foreground">{log.description}</span>
                        {log.account && (
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">{log.account}</span>
                        )}
                        <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                          {log.ip && <span className="hidden font-mono sm:inline">{log.ip}</span>}
                          <span>{fmtDate(log.created_at)}</span>
                        </span>
                      </li>
                    )
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
