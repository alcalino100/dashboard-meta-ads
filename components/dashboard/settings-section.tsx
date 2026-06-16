"use client"

import { useEffect, useState } from "react"
import { Save, Check, PlugZap, RefreshCw } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettings, saveSettings } from "@/lib/use-store"
import { useFilters } from "@/lib/filters-context"
import { useNavigate } from "@/lib/nav-context"
import { LoadingState } from "./states"

type Prefs = {
  org_name: string
  default_range: string
  currency: string
  alert_email: string
  notify_email: boolean
  notify_critical: boolean
}

const DEFAULTS: Prefs = {
  org_name: "Colucci",
  default_range: "last_30d",
  currency: "BRL",
  alert_email: "",
  notify_email: true,
  notify_critical: true,
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-md border border-border p-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
      <button
        type="button" role="switch" aria-checked={checked} aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`inline-block size-5 transform rounded-full bg-background transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  )
}

export function SettingsSection() {
  const { settings, isLoading } = useSettings()
  const { connected, accounts, statusLoading } = useFilters()
  const navigate = useNavigate()
  const [form, setForm] = useState<Prefs>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings && Object.keys(settings).length) {
      setForm({ ...DEFAULTS, ...(settings as Partial<Prefs>) })
    }
  }, [settings])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await saveSettings(form as unknown as Record<string, unknown>)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <LoadingState label="Carregando configurações..." />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Configurações</h2>
          <p className="text-sm text-muted-foreground">Preferências do painel, salvas no banco de dados</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={save} disabled={saving}>
          {saved ? <Check className="size-4" /> : <Save className="size-4" />}
          {saving ? "Salvando..." : saved ? "Salvo" : "Salvar alterações"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geral</CardTitle>
            <CardDescription>Identidade e padrões de exibição</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Nome da organização</Label>
              <Input value={form.org_name} onChange={(e) => setForm({ ...form, org_name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Período padrão</Label>
              <Select value={form.default_range} onValueChange={(v) => setForm({ ...form, default_range: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="last_7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="last_14d">Últimos 14 dias</SelectItem>
                  <SelectItem value="last_30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="this_month">Este mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Moeda de exibição</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar (US$)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notificações</CardTitle>
            <CardDescription>Como você recebe alertas das regras</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">E-mail para alertas</Label>
              <Input
                type="email" placeholder="alertas@empresa.com"
                value={form.alert_email} onChange={(e) => setForm({ ...form, alert_email: e.target.value })}
              />
            </div>
            <Toggle
              checked={form.notify_email} onChange={(v) => setForm({ ...form, notify_email: v })}
              label="Resumo por e-mail" desc="Receber um resumo diário de performance"
            />
            <Toggle
              checked={form.notify_critical} onChange={(v) => setForm({ ...form, notify_critical: v })}
              label="Alertas críticos" desc="Notificar imediatamente quando uma regra crítica disparar"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conexão Meta</CardTitle>
          <CardDescription>Status da integração com a Meta Marketing API</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`flex size-9 items-center justify-center rounded-full ${connected ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              <PlugZap className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                {statusLoading ? "Verificando..." : connected ? "Conectado" : "Sem conexão ativa"}
              </p>
              <p className="text-xs text-muted-foreground">
                {connected ? `${accounts.length} conta(s) de anúncio acessível(is)` : "Conecte um Business Manager para sincronizar dados"}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("Integrações")}>
            <RefreshCw className="size-4" /> Gerenciar conexões
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
