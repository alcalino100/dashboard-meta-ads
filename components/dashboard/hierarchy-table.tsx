"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Search, ArrowUpDown, ChevronRight } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type Column<T> = {
  key: string
  label: string
  align?: "left" | "right"
  sticky?: boolean
  sortValue?: (row: T) => number | string
  render: (row: T) => ReactNode
}

const PER_PAGE = 8

export function HierarchyTable<T extends { id: string; name: string }>({
  rows,
  columns,
  searchPlaceholder,
  drillLabel,
  onDrill,
  onOpen,
}: {
  rows: T[]
  columns: Column<T>[]
  searchPlaceholder: string
  drillLabel?: string
  onDrill?: (row: T) => void
  onOpen: (row: T) => void
}) {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<string>("spend")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)

  const sortable = useMemo(() => new Map(columns.filter((c) => c.sortValue).map((c) => [c.key, c])), [columns])

  const filtered = useMemo(() => {
    const col = sortable.get(sortKey)
    return rows
      .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => {
        if (!col?.sortValue) return 0
        const dir = sortDir === "asc" ? 1 : -1
        const va = col.sortValue(a)
        const vb = col.sortValue(b)
        if (typeof va === "string") return va.localeCompare(vb as string) * dir
        return ((va as number) - (vb as number)) * dir
      })
  }, [rows, query, sortKey, sortDir, sortable])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const current = Math.min(page, totalPages)
  const pageRows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("desc") }
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-9 border-border bg-secondary/40 pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn(
                    c.align === "right" && "text-right",
                    c.sticky && "sticky left-0 z-10 bg-card min-w-[220px]",
                  )}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cn("inline-flex items-center gap-1 hover:text-foreground", c.align === "right" && "ml-auto")}
                    >
                      {c.label}
                      <ArrowUpDown className={cn("size-3", sortKey === c.key ? "text-primary" : "text-muted-foreground/50")} />
                    </button>
                  ) : c.label}
                </TableHead>
              ))}
              <TableHead className="w-px text-right">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-32 text-center text-sm text-muted-foreground">
                  Nenhum item encontrado com a busca atual.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((r) => (
              <TableRow key={r.id} onClick={() => onOpen(r)} className="cursor-pointer">
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    className={cn(
                      c.align === "right" && "text-right font-mono tabular-nums",
                      c.sticky && "sticky left-0 z-10 bg-card font-medium text-foreground",
                    )}
                  >
                    {c.render(r)}
                  </TableCell>
                ))}
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  {onDrill && drillLabel ? (
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onDrill(r)}>
                      {drillLabel} <ChevronRight className="size-3.5" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onOpen(r)}>
                      Abrir
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground tabular-nums">
          {filtered.length} item(ns) · página {current} de {totalPages}
        </p>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="h-8" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" className="h-8" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>
            Próxima
          </Button>
        </div>
      </div>
    </Card>
  )
}
