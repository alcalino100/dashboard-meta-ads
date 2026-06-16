"use client"

import { useState } from "react"
import {
  Plug, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Database, ArrowRight, Loader2, KeyRound,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { fmtCurrency } from "@/lib/format"
import { useStatus, useAccounts } from "@/lib/use-meta"
import { useConnections, testConnection } from "@/lib/use-store"
import { CONNECTION_STATUS, TONE_CLS } from "@/lib/connection-status"
import { entities, metricDefs, messageMetrics } from "@/lib/mock-data"

const REQUIRED_SCOPES = ["ads_read", "ads_management", "business_management"]

function accountStatusCfg(status: number) {
  if (status === 1) return { label: "Ativa", cls: "text-success", bg: "border-success/20 bg-success/10" }
  if (status === 2 || status === 101) return { label: "Desativada", cls: "text-destructive", bg: "border-destructive/20 bg-destructive/10" }
  return { label: "Pendente", cls: "text-warning", bg: "border-warning/20 bg-warning/10" }
}

function Connections() {
  const { data: status, error: statusError, isLoading: statusLoading, mutate: refetchStatus } = useStatus()
  const { data: accountsData, isLoading: accountsLoading, mutate: refetchAccounts } = useAccounts()

  const connected = status?.connected
  const missingScopes = REQUIRED_SCOPES.filter((s) => !(status?.permissions ?? []).includes(s))
  const accounts = accountsData?.accounts ?? []

  const test = () => {
    refetchStatus()
    refetchAccounts()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Card de status da conexão */}
      <Card className="p-0">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex size-11 items-center justify-center rounded-md border",
                connected ? "border-success/20 bg-success/10" : "border-destructive/20 bg-destructive/10",
              )}>
                <Plug className={cn("size-5", connected ? "text-success" : "text-destructive")} />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-foreground">
                  {statusLoading ? "Verificando conexão..." : connected ? status?.user?.name : "Não conectado"}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  App ID {status?.appId ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connected ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="size-3.5" /> Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                  <XCircle className="size-3.5" /> Falha
                </span>
              )}
              <Button size="sm" variant="outline" className="gap-1.5" onClick={test} disabled={statusLoading}>
                {statusLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Testar conexão
              </Button>
            </div>
          </div>

          {statusError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
              {statusError.message}
            </p>
          )}
          {status && !connected && status.error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
              {status.error}
            </p>
          )}

          {/* Escopos / permissões */}
          <div className="border-t border-border pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <KeyRound className="size-3.5" /> Permissões do token
            </p>
            <div className="flex flex-wrap gap-1.5">
              {REQUIRED_SCOPES.map((s) => {
                const granted = (status?.permissions ?? []).includes(s)
                return (
                  <span key={s} className={cn(
                    "inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[11px]",
                    granted ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                  )}>
                    {granted ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                    {s}
                  </span>
                )
              })}
            </div>
            {missingScopes.length > 0 && connected && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
                <AlertTriangle className="size-3.5" /> Faltam escopos: {missingScopes.join(", ")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contas de anúncio reais */}
      <Card className="overflow-hidden p-0">
        <CardHeader className="flex-row items-center justify-between p-4">
          <div>
            <CardTitle className="text-base">Contas de anúncio</CardTitle>
            <CardDescription>
              {accountsLoading ? "Carregando..." : `${accounts.length} conta(s) acessível(is) pelo token`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {accountsLoading && !accountsData ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Buscando contas...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Conta</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Moeda</TableHead>
                    <TableHead className="text-right">Gasto histórico</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((a) => {
                    const cfg = accountStatusCfg(a.status)
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-foreground">{a.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{a.accountId}</TableCell>
                        <TableCell className="text-muted-foreground">{a.currency}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                          {fmtCurrency(a.amountSpent)}
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium", cfg.bg, cfg.cls)}>
                            {cfg.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DataModel() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {entities.map((e) => (
        <Card key={e.name} className="p-0">
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-primary" />
              <p className="font-mono text-sm font-semibold text-foreground">{e.name}</p>
            </div>
            <p className="text-xs text-muted-foreground">{e.desc}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {e.fields.map((f) => (
                <span key={f} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-secondary-foreground">{f}</span>
              ))}
            </div>
            <div className="mt-1 flex items-center gap-1 border-t border-border pt-2 text-xs text-muted-foreground">
              <ArrowRight className="size-3" /> {e.rel}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function relativeTime(iso: string | null) {
  if (!iso) return "Nunca"
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "Agora"
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)} dia(s)`
}

function SyncJobs() {
  const { connections, isLoading } = useConnections()
  const [syncing, setSyncing] = useState<string | null>(null)

  const sync = async (id: string) => {
    setSyncing(id)
    try {
      await testConnection(id)
    } finally {
      setSyncing(null)
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="p-4">
        <CardTitle className="text-base">Status de sincronização</CardTitle>
        <CardDescription>Última coleta e verificação por conexão Meta</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando conexões...
          </div>
        ) : connections.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma conexão cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Conexão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última sincronização</TableHead>
                  <TableHead>Última verificação</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((c) => {
                  const cfg = CONNECTION_STATUS[c.status] ?? CONNECTION_STATUS.connected
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium", TONE_CLS[cfg.tone])}>
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{relativeTime(c.last_sync_at)}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{relativeTime(c.last_test_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => sync(c.id)} disabled={syncing === c.id}>
                          {syncing === c.id ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                          Sincronizar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const groupLabels: Record<string, string> = { core: "Volume", efficiency: "Eficiência", actions: "Ações & Conversões" }

function Metrics() {
  const groups = ["core", "efficiency", "actions"]
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <Card key={g}>
          <CardHeader>
            <CardTitle className="text-base">{groupLabels[g]}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metricDefs.filter((m) => m.group === g).map((m) => (
              <div key={m.key} className="rounded-md border border-border p-3">
                <p className="font-mono text-xs text-primary">{m.key}</p>
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas de mensagens</CardTitle>
          <CardDescription>Conversas e custo por conversa (WhatsApp/Direct)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {messageMetrics.map((m) => (
            <div key={m.key} className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{m.value}</p>
              <p className="font-mono text-[10px] text-primary">{m.key}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function IntegrationsSection() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Integração Meta Ads</h2>
        <p className="text-sm text-muted-foreground">Conexões, modelo de dados, sincronização e métricas</p>
      </div>
      <Tabs defaultValue="connections">
        <TabsList>
          <TabsTrigger value="connections">Conexões</TabsTrigger>
          <TabsTrigger value="model">Modelo de dados</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>
        <TabsContent value="connections" className="mt-4"><Connections /></TabsContent>
        <TabsContent value="model" className="mt-4"><DataModel /></TabsContent>
        <TabsContent value="sync" className="mt-4"><SyncJobs /></TabsContent>
        <TabsContent value="metrics" className="mt-4"><Metrics /></TabsContent>
      </Tabs>
    </div>
  )
}
