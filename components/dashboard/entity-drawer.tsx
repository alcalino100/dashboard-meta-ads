"use client"

import Image from "next/image"
import { ChevronRight, Pause, Pencil } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"
import type { Status } from "@/lib/meta-api"

export type DrawerItem = {
  title: string
  status: Status
  subtitle: string
  metrics: { label: string; value: string }[]
  info: { t: string; d: string }[]
  thumbnail?: string | null
  creativeTitle?: string
  body?: string
  drill?: { label: string; onClick: () => void }
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

export function EntityDrawer({
  item,
  open,
  onOpenChange,
}: {
  item: DrawerItem | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {item && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
              </div>
              <SheetTitle className="text-balance text-left">{item.title}</SheetTitle>
              <SheetDescription className="text-left">{item.subtitle}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1.5">
                  <Pause className="size-3.5" /> Pausar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1.5">
                  <Pencil className="size-3.5" /> Editar
                </Button>
              </div>

              {(item.thumbnail || item.body) && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    {item.thumbnail && (
                      <Image
                        src={item.thumbnail || "/placeholder.svg"}
                        alt={`Criativo de ${item.title}`}
                        width={72}
                        height={72}
                        unoptimized
                        crossOrigin="anonymous"
                        className="size-18 shrink-0 rounded-md border border-border object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      {item.creativeTitle && <p className="text-sm font-medium text-foreground">{item.creativeTitle}</p>}
                      {item.body && <p className="mt-0.5 line-clamp-4 text-xs text-muted-foreground">{item.body}</p>}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Métricas do período
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {item.metrics.map((m) => (
                    <Metric key={m.label} label={m.label} value={m.value} />
                  ))}
                </div>
              </div>

              {item.info.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Informações
                    </p>
                    <ul className="flex flex-col gap-2">
                      {item.info.map((h, i) => (
                        <li key={i} className="flex items-center justify-between gap-4 text-sm">
                          <span className="shrink-0 text-muted-foreground">{h.t}</span>
                          <span className="truncate text-right text-foreground">{h.d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {item.drill && (
                <Button className="gap-1.5" onClick={item.drill.onClick}>
                  {item.drill.label} <ChevronRight className="size-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
