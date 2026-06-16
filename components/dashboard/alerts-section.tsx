"use client"

import { AlertTriangle, AlertCircle, Info, Plus } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { alerts, events, accounts } from "@/lib/mock-data"
import { ConnectionGate } from "./states"
import { useNavigate } from "@/lib/nav-context"

const sevConfig = {
  high: { icon: AlertCircle, cls: "text-destructive", bg: "bg-destructive/10 border-destructive/20", label: "Alta" },
  medium: { icon: AlertTriangle, cls: "text-warning", bg: "bg-warning/10 border-warning/20", label: "Média" },
  low: { icon: Info, cls: "text-primary", bg: "bg-primary/10 border-primary/20", label: "Baixa" },
}

export function AlertsSection() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Alertas e automações</h2>
        <p className="text-sm text-muted-foreground">Regras operacionais vinculadas às conexões Meta ativas</p>
      </div>

      <ConnectionGate onGoToConnections={() => navigate("Integrações")}>
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Lista de alertas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Alertas de performance</CardTitle>
            <CardDescription>{alerts.length} alertas ativos</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {alerts.map((a) => {
              const cfg = sevConfig[a.severity]
              const Icon = cfg.icon
              return (
                <div key={a.id} className={cn("flex items-start gap-3 rounded-md border p-3", cfg.bg)}>
                  <Icon className={cn("mt-0.5 size-4 shrink-0", cfg.cls)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", cfg.cls)}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.campaign} · {a.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{a.time}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Builder de regras */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova regra</CardTitle>
            <CardDescription>Condição, escopo e ação</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Quando a métrica</Label>
              <Select defaultValue="cpmsg">
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpmsg">Custo por mensagem</SelectItem>
                  <SelectItem value="cpc">CPC</SelectItem>
                  <SelectItem value="ctr">CTR</SelectItem>
                  <SelectItem value="freq">Frequência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Operador</Label>
                <Select defaultValue="gt">
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gt">Maior que</SelectItem>
                    <SelectItem value="lt">Menor que</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Valor</Label>
                <Select defaultValue="6">
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">R$ 6,00</SelectItem>
                    <SelectItem value="8">R$ 8,00</SelectItem>
                    <SelectItem value="10">R$ 10,00</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Escopo</Label>
              <Select defaultValue="all">
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Ação sugerida</Label>
              <Select defaultValue="pause">
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pause">Pausar campanha</SelectItem>
                  <SelectItem value="notify">Notificar gestor</SelectItem>
                  <SelectItem value="budget">Reduzir orçamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="mt-1 gap-1.5">
              <Plus className="size-4" /> Criar regra
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de eventos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de eventos</CardTitle>
          <CardDescription>Operações recentes do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {events.map((e, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                <p className="text-foreground">
                  <span className="font-medium">{e.actor}</span>{" "}
                  <span className="text-muted-foreground">{e.action}</span>{" "}
                  <span className="font-medium">{e.target}</span>
                </p>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">{e.time}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      </ConnectionGate>
    </div>
  )
}
