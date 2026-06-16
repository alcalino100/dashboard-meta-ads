"use client"

import { useState, useMemo } from "react"
import { LogIn, LogOut, ShieldAlert, KeyRound, AlertTriangle, Plus, Trash2, Settings2, History } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAudit, type AuditRow } from "@/lib/use-store"
import { LoadingState, ErrorState, DataEmptyState } from "./states"

const actionCfg: Record<string, { icon: React.ComponentType<{ className?: string }>; cls: string; dot: string }> = {
  login: { icon: LogIn, cls: "text-success", dot: "bg-success" },
  logout: { icon: LogOut, cls: "text-muted-foreground", dot: "bg-muted-foreground" },
  login_failed: { icon: ShieldAlert, cls: "text-destructive", dot: "bg-destructive" },
  permission_change: { icon: KeyRound, cls: "text-warning", dot: "bg-warning" },
  settings: { icon: Settings2, cls: "text-primary", dot: "bg-primary" },
  create: { icon: Plus, cls: "text-success", dot: "bg-success" },
  update: { icon: KeyRound, cls: "text-warning", dot: "bg-warning" },
  delete: { icon: Trash2, cls: "text-destructive", dot: "bg-destructive" },
  critical: { icon: AlertTriangle, cls: "text-primary", dot: "bg-primary" },
}

function fallbackCfg(action: string) {
  return actionCfg[action] ?? { icon: History, cls: "text-muted-foreground", dot: "bg-muted-foreground" }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export function AuditSection() {
  const { logs, isLoading, error } = useAudit()
  const [actor, setActor] = useState("all")
  const [action, setAction] = useState("all")

  const actors = useMemo(() => Array.from(new Set(logs.map((l) => l.actor))), [logs])
  const actionsList = useMemo(() => Array.from(new Set(logs.map((l) => l.action))), [logs])

  const filtered = useMemo(
    () => logs.filter((l) => (actor === "all" || l.actor === actor) && (action === "all" || l.action === action)),
    [logs, actor, action],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Auditoria</h2>
        <p className="text-sm text-muted-foreground">Registro real de eventos e ações no painel</p>
      </div>

      {isLoading ? (
        <LoadingState label="Carregando auditoria..." />
      ) : error ? (
        <ErrorState message="Não foi possível carregar a auditoria." />
      ) : logs.length === 0 ? (
        <DataEmptyState
          icon={History}
          title="Nenhum evento registrado ainda"
          description="As ações realizadas no painel (criar metas, convidar usuários, alterar configurações) passam a ser registradas aqui automaticamente."
        />
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 p-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Usuário</Label>
                <Select value={actor} onValueChange={setActor}>
                  <SelectTrigger className="h-9 w-44" aria-label="Filtrar por usuário"><SelectValue /></SelectTrigger>
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
                    {actionsList.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
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
                  {filtered.map((log: AuditRow) => {
                    const cfg = fallbackCfg(log.action)
                    const Icon = cfg.icon
                    return (
                      <li key={log.id} className="relative flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                        <span className={cn("absolute -left-[1.6rem] flex size-3 items-center justify-center rounded-full ring-4 ring-card", cfg.dot)} />
                        <Icon className={cn("size-4 shrink-0", cfg.cls)} />
                        <span className="text-sm font-medium text-foreground">{log.actor}</span>
                        <span className="text-sm text-muted-foreground">{log.description}</span>
                        {log.account && <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">{log.account}</span>}
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
