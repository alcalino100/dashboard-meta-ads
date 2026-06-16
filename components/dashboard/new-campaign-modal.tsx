"use client"

import { useState } from "react"
import { Check, ChevronRight, ChevronLeft, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { accounts } from "@/lib/mock-data"

const steps = ["Objetivo", "Naming", "Conta", "Orçamento", "Público", "Posicionamentos", "Criativos", "Revisão"]

export function NewCampaignModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const last = steps.length - 1

  const reset = () => {
    setStep(0)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" /> Nova campanha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova campanha</DialogTitle>
          <DialogDescription>
            Etapa {step + 1} de {steps.length} — {steps[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex flex-wrap items-center gap-1.5 py-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                  i < step && "bg-primary text-primary-foreground",
                  i === step && "bg-primary/20 text-primary ring-1 ring-primary",
                  i > step && "bg-secondary text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3" /> : i + 1}
              </div>
              {i < last && <div className={cn("h-px w-4", i < step ? "bg-primary" : "bg-border")} />}
            </div>
          ))}
        </div>

        <div className="min-h-[180px] py-2">
          {step === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {["Mensagens", "Conversões", "Tráfego", "Alcance", "Engajamento", "Reconhecimento"].map((o, i) => (
                <label key={o} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm hover:bg-accent">
                  <input type="radio" name="objective" defaultChecked={i === 0} className="size-4 accent-primary" />
                  {o}
                </label>
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <Field label="Nome da campanha" placeholder="[CONTA]_[OBJETIVO]_[PÚBLICO]_[DATA]" defaultValue="COLUCCI_MSG_REMARKETING_JUN26" />
              <p className="text-xs text-muted-foreground">
                Use a convenção de nomenclatura padrão para manter relatórios consistentes entre contas.
              </p>
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              <Label className="text-sm">Conta de anúncio</Label>
              <Select defaultValue={accounts[0].name}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.name}>{a.name} · {a.business}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {step === 3 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Orçamento diário (R$)" type="number" defaultValue="250" />
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Estratégia de lance</Label>
                <Select defaultValue="auto">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Mais baixo (automático)</SelectItem>
                    <SelectItem value="cap">Limite de custo</SelectItem>
                    <SelectItem value="bid">Limite de lance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Idade" defaultValue="25 - 54" />
              <Field label="Localização" defaultValue="Brasil" />
              <Field label="Interesses" defaultValue="Joias, Luxo, Moda" />
              <Field label="Públicos personalizados" defaultValue="Lookalike 1% compradores" />
            </div>
          )}
          {step === 5 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {["Feed Instagram", "Stories", "Reels", "Feed Facebook", "Messenger", "Audience Network"].map((p, i) => (
                <label key={p} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm hover:bg-accent">
                  <input type="checkbox" defaultChecked={i < 4} className="size-4 accent-primary" />
                  {p}
                </label>
              ))}
            </div>
          )}
          {step === 6 && (
            <div className="flex flex-col gap-3">
              <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Arraste criativos ou selecione da biblioteca
              </div>
              <Field label="Texto principal" defaultValue="Peças exclusivas com até 30% OFF nesta semana." />
            </div>
          )}
          {step === 7 && (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-secondary/30 p-4 text-sm">
              {[
                ["Objetivo", "Mensagens"],
                ["Nome", "COLUCCI_MSG_REMARKETING_JUN26"],
                ["Conta", accounts[0].name],
                ["Orçamento", "R$ 250,00 / dia"],
                ["Público", "25-54 · Brasil · Lookalike 1%"],
                ["Posicionamentos", "4 selecionados"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-foreground">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft className="size-4" /> Voltar
          </Button>
          {step < last ? (
            <Button size="sm" className="gap-1" onClick={() => setStep((s) => Math.min(last, s + 1))}>
              Próximo <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button size="sm" className="gap-1" onClick={reset}>
              <Check className="size-4" /> Criar campanha
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}</Label>
      <Input {...props} />
    </div>
  )
}
