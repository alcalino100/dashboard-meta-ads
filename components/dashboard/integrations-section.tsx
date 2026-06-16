"use client"

import { useState } from "react"
import {
  Plug, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Database,
  ArrowRight, Loader2, KeyRound, Plus, Trash2, Eye, EyeOff, Copy, Check, X,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { fmtCurrency } from "@/lib/format"
import { useStatus, useAccounts } from "@/lib/use-meta"
import { entities, syncJobs, metricDefs, messageMetrics, type JobStatus } from "@/lib/mock-data"

const REQUIRED_SCOPES = ["ads_read", "ads_management", "business_management"]

type TokenEntry = {
  id: string
  label: string
  appId: string
  accessToken: string
  createdAt: string
  active: boolean
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function accountStatusCfg(status: number) {
  if (status === 1) return { label: "Ativa", cls: "text-success", bg: "border-success/20 bg-success/10" }
  if (status === 2 || status === 101) return { label: "Desativada", cls: "text-destructive", bg: "border-destructive/20 bg-destructive/10" }
  return { label: "Pendente", cls: "text-warning", bg: "border-warning/20 bg-warning/10" }
}

const jobCfg: Record<JobStatus, { label: string; cls: string }> = {
  queued: { label: "Em fila", cls: "bg-secondary text-secondary-foreground" },
  processing: { label: "Processando", cls: "bg-primary/15 text-primary" },
  success: { label: "Sucesso", cls: "bg-success/15 text-success" },
  partial: { label: "Falha parcial", cls: "bg-warning/15 text-warning" },
  failed: { label: "Falha total", cls: "bg-destructive/15 text-destructive" },
}

function MaskedToken({ value }: { value: string }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-muted-foreground">
        {show ? value : value.slice(0, 8) + "•".repeat(12) + value.slice(-4)}
      </span>
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Ocultar token" : "Mostrar token"}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
      <button
        type="button"
        onClick={copy}
        aria-label="Copiar token"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}

function TokenManager() {
  const [tokens, setTokens] = useState<TokenEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [label, setLabel] = useState("")
  const [appId, setAppId] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [formError, setFormError] = useState("")

  const openForm = () => {
    setLabel("")
    setAppId("")
    setAccessToken("")
    setFormError("")
    setShowForm(true)
  }

  const closeForm = () => {
    setLabel("")
    setAppId("")
    setAccessToken("")
    setFormError("")
    setShowForm(false)
  }

  const addToken = () => {
    if (!label.trim()) { setFormError("Informe um nome para identificar este token."); return }
    if (!appId.trim()) { setFormError("Informe o App ID do Meta for Developers."); return }
    if (accessToken.length < 20) { setFormError("O Access Token parece inválido (muito curto)."); return }

    const newToken: TokenEntry = {
      id: generateId(),
      label: label.trim(),
      appId: appId.trim(),
      accessToken: accessToken.trim(),
      createdAt: new Date().toLocaleDateString("pt-BR"),
      active: tokens.length === 0,
    }
    setTokens((prev) => [...prev, newToken])
    closeForm()
  }

  const removeToken = (id: string) => {
    setTokens((prev) => {
      const updated = prev.filter((t) => t.id !== id)
      // Se o token removido era o ativo e ainda há tokens, ativa o primeiro
      const removedWasActive = prev.find((t) => t.id === id)?.active
      if (removedWasActive && updated.length > 0) {
        return updated.map((t, i) => ({ ...t, active: i === 0 }))
      }
      return updated
    })
    setDeleteId(null)
  }

  const setActive = (id: string) => {
    setTokens((prev) => prev.map((t) => ({ ...t, active: t.id === id })))
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden p-0">
        <CardHeader className="flex-row items-center justify-between p-4">
          <div>
            <CardTitle className="text-base">Tokens de acesso</CardTitle>
            <CardDescription>App ID + User Access Token do Meta for Developers</CardDescription>
          </div>
          {!showForm && (
            <Button size="sm" className="gap-1.5" onClick={openForm}>
              <Plus className="size-4" />
              Adicionar token
            </Button>
          )}
        </CardHeader>

        {/* Formulário inline */}
        {showForm && (
          <div className="border-t border-border bg-muted/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Novo token de acesso Meta</p>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Fechar formulário"
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="token-label" className="text-xs">Nome / Identificador *</Label>
                <Input
                  id="token-label"
                  value={label}
                  onChange={(e) => { setLabel(e.target.value); setFormError("") }}
                  placeholder="Ex: Conta principal Garcia"
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="token-appid" className="text-xs">App ID *</Label>
                <Input
                  id="token-appid"
                  value={appId}
                  onChange={(e) => { setAppId(e.target.value); setFormError("") }}
                  placeholder="Ex: 1234567890123456"
                  className="h-8 font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="token-value" className="text-xs">User Access Token *</Label>
                <Input
                  id="token-value"
                  type="password"
                  value={accessToken}
                  onChange={(e) => { setAccessToken(e.target.value); setFormError("") }}
                  placeholder="EAABwzLixnjYBO..."
                  className="h-8 font-mono text-sm"
                />
              </div>
            </div>
            {formError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                <XCircle className="size-3.5 shrink-0" />{formError}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={addToken}>Salvar token</Button>
              <Button size="sm" variant="ghost" onClick={closeForm}>Cancelar</Button>
            </div>
            <p className="mt-3 rounded-md border border-warning/20 bg-warning/10 p-2.5 text-xs text-warning">
              ⚠️ Gere um token de longa duração (Long-Lived Token) no Meta for Developers.
              Tokens de curta duração expiram em 1–2h.
            </p>
          </div>
        )}

        <CardContent className="p-0">
          {tokens.length === 0 && !showForm ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <KeyRound className="size-8 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nenhum token cadastrado</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Adicione seu App ID e User Access Token do Meta for Developers para conectar suas contas de anúncio.
                </p>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={openForm}>
                <Plus className="size-4" /> Adicionar primeiro token
              </Button>
            </div>
          ) : tokens.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nome</TableHead>
                    <TableHead>App ID</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Adicionado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-foreground">{t.label}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{t.appId}</TableCell>
                      <TableCell><MaskedToken value={t.accessToken} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">{t.createdAt}</TableCell>
                      <TableCell>
                        {t.active ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                            <CheckCircle2 className="size-3" /> Ativo
                          </span>
                        ) : (
                          <button
                            onClick={() => setActive(t.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                          >
                            Definir ativo
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {deleteId === t.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-muted-foreground">Confirmar?</span>
                            <button
                              onClick={() => removeToken(t.id)}
                              className="text-xs font-semibold text-destructive hover:underline"
                            >Sim</button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="text-xs text-muted-foreground hover:underline"
                            >Não</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(t.id)}
                            aria-label={`Remover token ${t.label}`}
                            className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="size-3.5" /> Remover
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
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
      <TokenManager />

      {/* Status da conexão ativa */}
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
                  {statusLoading ? "Verificando conexão..." : connected ? status?.user?.name : "Nenhum token ativo"}
                </p>
                <p className="font-mono text-xs text-muted-foreground">App ID {status?.appId ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connected ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="size-3.5" /> Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                  <XCircle className="size-3.5" /> Não conectado
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

          <div className="border-t border-border pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <KeyRound className="size-3.5" /> Permissões do token ativo
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

      {/* Contas de anúncio — só exibe quando conectado */}
      {connected && (
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
      )}
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

function SyncJobs() {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="flex-row items-center justify-between p-4">
        <div>
          <CardTitle className="text-base">Jobs de sincronização</CardTitle>
          <CardDescription>Histórico de coleta por conta</CardDescription>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5"><RefreshCw className="size-4" /> Sincronizar agora</Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Job</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Janela</TableHead>
                <TableHead className="text-right">Linhas</TableHead>
                <TableHead className="text-right">Duração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Concluído</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncJobs.map((j) => {
                const cfg = jobCfg[j.status]
                return (
                  <TableRow key={j.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{j.id}</TableCell>
                    <TableCell className="font-medium text-foreground">{j.account}</TableCell>
                    <TableCell className="text-muted-foreground">{j.window}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{j.rows.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{j.duration}</TableCell>
                    <TableCell>
                      <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-medium", cfg.cls)}>{cfg.label}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{j.finished}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
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
