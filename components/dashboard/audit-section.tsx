"use client"

import { useState, useMemo } from "react"
import { LogIn, LogOut, ShieldAlert, KeyRound, AlertTriangle } from "lucide-react"
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
import { auditLogs, users, accounts, type AuditAction } from "@/lib/mock-data"

const actionCfg: Record<AuditAction, { icon: React.ComponentType<{ className?: string }>; label: string; cls: string; dot: string }> = {
  login: { icon: LogIn, label: "Login", cls: "text-success", dot: "bg-success" },
  logout: { icon: LogOut, label: "Logout", cls: "text-muted-foreground", dot: "bg-muted-foreground" },
  login_failed: { icon: ShieldAlert, label: "Falha de login", cls: "text-destructive", dot: "bg-destructive" },
  permission_change: { icon: KeyRound, label: "Permissão", cls: "text-warning", dot: "bg-warning" },
  critical: { icon: AlertTriangle, label: "Ação crítica", cls: "text-primary", dot: "bg-primary" },
}

export function AuditSection() {
  const [actor, setActor] = useState("all")
  const [action, setAction] = useState("all")
  const [account, setAccount] = useState("all")

  const filtered = useMemo(
    () =>
      auditLogs.filter(
        (l) =>
          (actor === "all" || l.actor === actor) &&
          (action === "all" || l.action === action) &&
          (account === "all" || l.account === account),
      ),
    [actor, action, account],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Auditoria</h2>
        <p className="text-sm text-muted-foreground">Registro de eventos de acesso e ações críticas</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Usuário</Label>
            <Select value={actor} onValueChange={setActor}>
              <SelectTrigger className="h-9 w-44" aria-label="Filtrar por usuário"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Sistema">Sistema</SelectItem>
                {users.map((u) => <SelectItem key={u.email} value={u.name}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Ação</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-9 w-44" aria-label="Filtrar por ação"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="login_failed">Falha de login</SelectItem>
                <SelectItem value="permission_change">Alteração de permissão</SelectItem>
                <SelectItem value="critical">Ação crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Conta</Label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger className="h-9 w-44" aria-label="Filtrar por conta"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {accounts.map((a) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline de eventos</CardTitle>
          <CardDescription>{filtered.length} eventos no período</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento corresponde aos filtros.</p>
          ) : (
            <ol className="relative flex flex-col gap-1 border-l border-border pl-5">
              {filtered.map((log) => {
                const cfg = actionCfg[log.action]
                const Icon = cfg.icon
                return (
                  <li key={log.id} className="relative flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    <span className={cn("absolute -left-[1.6rem] flex size-3 items-center justify-center rounded-full ring-4 ring-card", cfg.dot)} />
                    <Icon className={cn("size-4 shrink-0", cfg.cls)} />
                    <span className="text-sm font-medium text-foreground">{log.actor}</span>
                    <span className="text-sm text-muted-foreground">{log.description}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">{log.account}</span>
                    <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                      <span className="hidden font-mono sm:inline">{log.ip}</span>
                      <span>{log.date}</span>
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
