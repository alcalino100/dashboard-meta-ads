"use client"

import { useState } from "react"
import { Plus, TrendingDown, TrendingUp, Trash2, Target } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useGoals, createItem, deleteItem, type Goal } from "@/lib/use-store"
import { useFilters } from "@/lib/filters-context"
import { LoadingState, ErrorState, DataEmptyState } from "./states"

function fmt(v: number, unit: string) {
  if (unit === "R$") return `R$ ${Number(v).toFixed(2).replace(".", ",")}`
  if (unit === "%") return `${Number(v).toFixed(2).replace(".", ",")}%`
  return String(v)
}

export function GoalsSection() {
  const { goals, isLoading, error } = useGoals()
  const { accounts } = useFilters()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    account_name: "",
    metric: "Custo por mensagem",
    target: "",
    current: "",
    unit: "R$",
    direction: "down" as "up" | "down",
  })

  const submit = async () => {
    if (!form.account_name || !form.target) return
    setSaving(true)
    try {
      await createItem("goals", {
        account_name: form.account_name,
        metric: form.metric,
        target: Number(form.target),
        current: Number(form.current || 0),
        unit: form.unit,
        direction: form.direction,
      })
      setOpen(false)
      setForm({ ...form, account_name: "", target: "", current: "" })
    } finally {
      setSaving(false)
    }
  }

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="size-4" /> Nova meta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova meta</DialogTitle>
          <DialogDescription>Defina um alvo por conta e objetivo</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Conta</Label>
            <Select value={form.account_name} onValueChange={(v) => setForm({ ...form, account_name: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Objetivo</Label>
            <Input value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} placeholder="Ex.: Custo por mensagem" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Meta</Label>
              <Input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Atual</Label>
              <Input type="number" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Unidade</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="R$">R$</SelectItem>
                  <SelectItem value="%">%</SelectItem>
                  <SelectItem value="">nº</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Direção desejada</Label>
            <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v as "up" | "down" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="down">Menor é melhor (custo)</SelectItem>
                <SelectItem value="up">Maior é melhor (resultado)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button size="sm" onClick={submit} disabled={saving || !form.account_name || !form.target}>
            {saving ? "Salvando..." : "Salvar meta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Metas por conta</h2>
          <p className="text-sm text-muted-foreground">Comparação entre meta e realizado por objetivo</p>
        </div>
        {dialog}
      </div>

      {isLoading ? (
        <LoadingState label="Carregando metas..." />
      ) : error ? (
        <ErrorState message="Não foi possível carregar as metas." />
      ) : goals.length === 0 ? (
        <DataEmptyState
          icon={Target}
          title="Nenhuma meta cadastrada"
          description="Crie metas por conta para acompanhar custo por mensagem, CPC, CTR e outros objetivos contra o realizado."
          actionLabel="Criar primeira meta"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g: Goal) => {
            const target = Number(g.target)
            const current = Number(g.current)
            const ratio = g.direction === "down" ? target / (current || 1) : current / (target || 1)
            const onTrack = ratio >= 1
            const pct = Math.min(Math.round(ratio * 100), 130)
            const Icon = g.direction === "down" ? TrendingDown : TrendingUp
            return (
              <Card key={g.id} className="p-0">
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="leading-tight">
                      <p className="text-sm font-medium text-foreground">{g.metric}</p>
                      <p className="text-xs text-muted-foreground">{g.account_name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                        onTrack ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
                      )}>
                        <Icon className="size-3.5" /> {onTrack ? "No alvo" : "Estourando"}
                      </span>
                      <Button
                        variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive"
                        aria-label="Excluir meta" onClick={() => deleteItem("goals", g.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Realizado</p>
                      <p className="text-xl font-semibold tabular-nums text-foreground">{fmt(current, g.unit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Meta</p>
                      <p className="text-sm font-medium tabular-nums text-muted-foreground">{fmt(target, g.unit)}</p>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full rounded-full transition-all", onTrack ? "bg-success" : "bg-warning")}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
