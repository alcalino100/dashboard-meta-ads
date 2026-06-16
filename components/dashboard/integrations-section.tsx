"use client"

import { useState } from "react"
import {
  Plug, CheckCircle2, AlertTriangle, ShieldOff, XCircle, RefreshCw, Plus, Database, ArrowRight,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  connections, entities, syncJobs, metricDefs, messageMetrics,
  type ConnStatus, type JobStatus,
} from "@/lib/mock-data"

const connCfg: Record<ConnStatus, { icon: React.ComponentType<{ className?: string }>; label: string; cls: string; bg: string }> = {
  connected: { icon: CheckCircle2, label: "Conectado", cls: "text-success", bg: "border-success/20 bg-success/10" },
  expiring: { icon: AlertTriangle, label: "Token expirando", cls: "text-warning", bg: "border-warning/20 bg-warning/10" },
  no_permission: { icon: ShieldOff, label: "Sem permissão", cls: "text-destructive", bg: "border-destructive/20 bg-destructive/10" },
  sync_error: { icon: XCircle, label: "Erro de sincronização", cls: "text-destructive", bg: "border-destructive/20 bg-destructive/10" },
}

const jobCfg: Record<JobStatus, { label: string; cls: string }> = {
  queued: { label: "Em fila", cls: "bg-secondary text-secondary-foreground" },
  processing: { label: "Processando", cls: "bg-primary/15 text-primary" },
  success: { label: "Sucesso", cls: "bg-success/15 text-success" },
  partial: { label: "Falha parcial", cls: "bg-warning/15 text-warning" },
  failed: { label: "Falha total", cls: "bg-destructive/15 text-destructive" },
}

function Connections() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const submit = () => {
    if (!name.trim()) return setError("Informe um nome para a conexão.")
    setError("")
    setName("")
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{connections.length} conexões Meta Business</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="size-4" /> Nova conexão</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar conexão Meta</DialogTitle>
              <DialogDescription>Conecte um Business Manager via System User token</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Nome da conexão</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Colucci Group BM" aria-invalid={!!error} className={cn(error && "border-destructive")} />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Business ID</Label>
                  <Input placeholder="178402993115" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">App ID</Label>
                  <Input placeholder="994201" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">System User Token</Label>
                <Input type="password" placeholder="Token nunca exposto no client" />
                <p className="text-xs text-muted-foreground">Armazenado de forma segura no servidor. Requer escopos ads_read e ads_management.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={submit}>Conectar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {connections.map((c) => {
          const cfg = connCfg[c.status]
          const Icon = cfg.icon
          return (
            <Card key={c.id} className="p-0">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-md bg-secondary">
                      <Plug className="size-4 text-foreground" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">BM {c.businessId}</p>
                    </div>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium", cfg.bg, cfg.cls)}>
                    <Icon className="size-3.5" /> {cfg.label}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>{c.accounts} conta(s) · App {c.appId}</span>
                  <span className="tabular-nums">Sync {c.lastSync}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
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
