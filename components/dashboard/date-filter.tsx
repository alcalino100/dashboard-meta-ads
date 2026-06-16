"use client"

import { useState } from "react"
import { Calendar, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { DATE_PRESETS, presetLabel, useFilters } from "@/lib/filters-context"

export function DateFilter() {
  const { range, setRange, compare, setCompare } = useFilters()
  const [open, setOpen] = useState(false)
  const [since, setSince] = useState("")
  const [until, setUntil] = useState("")
  const isCustom = range.startsWith("custom:")

  const applyCustom = () => {
    if (since && until) {
      setRange(`custom:${since}:${until}`)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label="Selecionar período"
            className="h-9 gap-2 border-border bg-secondary/40"
          />
        }
      >
        <Calendar className="size-4 text-muted-foreground" />
        <span className="text-xs font-medium">{presetLabel(range)}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="p-2">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Período
          </p>
          <div className="flex flex-col">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setRange(p.value)
                  setOpen(false)
                }}
                className={cn(
                  "flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary",
                  range === p.value && "bg-secondary",
                )}
              >
                {p.label}
                {range === p.value && <Check className="size-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2 p-3">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Intervalo personalizado
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="Data inicial"
              value={since}
              onChange={(e) => setSince(e.target.value)}
              className="h-8 text-xs"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <Input
              type="date"
              aria-label="Data final"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <Button size="sm" className="h-8" onClick={applyCustom} disabled={!since || !until}>
            Aplicar intervalo
          </Button>
          {isCustom && (
            <p className="text-xs text-muted-foreground">Ativo: {presetLabel(range)}</p>
          )}
        </div>

        <Separator />

        <label className="flex cursor-pointer items-center gap-2 p-3 text-sm text-foreground">
          <Checkbox checked={compare} onCheckedChange={(v) => setCompare(!!v)} aria-label="Comparar períodos" />
          Comparar com período anterior
        </label>
      </PopoverContent>
    </Popover>
  )
}
