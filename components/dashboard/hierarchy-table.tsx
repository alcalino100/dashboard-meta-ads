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
import { StatusBadge } from "./status-badge"
import { TableSkeleton } from "./states"
import type { Status } from "@/lib/mock-data"

export type Column<T> = {
  key: keyof T & string
  label: string
  sortable?: boolean
  primary?: boolean
  type?: "status"
  align?: "left" | "right"
  fmt?: (value: unknown, row: T) => ReactNode
}

const PER_PAGE = 8

export function HierarchyTable<T extends { id: string; name: string; status: Status }>({
  rows,
  columns,
  loading,
  entityLabel,
  emptyLabel,
  drillLabel,
  onDrill,
  onRowClick,
}: {
  rows: T[]
  columns: Column<T>[]
  loading?: boolean
  entityLabel: string
  emptyLabel: string
  drillLabel?: string
  onDrill?: (row: T) => void
  onRowClick: (row: T) => void
}) {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<string>("spend")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return rows
      .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1
        const va = a[sortKey as keyof T]
        const vb = b[sortKey as keyof T]
        if (typeof va === "string") return va.localeCompare(vb as string) * dir
        return ((va as number) - (vb as number)) * dir
      })
  }, [rows, query, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const current = Math.min(page, totalPages)
  const pageRows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("desc") }
  }

  if (loading) return <TableSkeleton rows={6} />

  if (rows.length === 0) {
    return (
      <Card className="items-center gap-2 p-12 text-center">
        <p className="text-sm font-medium text-foreground">{emptyLabel}</p>
        <p className="text-sm text-muted-foreground">Ajuste o período ou os filtros e tente novamente.</p>
      </Card>
    )
  }

  const renderCell = (col: Column<T>, row: T): ReactNode => {
    const value = row[col.key]
    if (col.type === "status") return <StatusBadge status={row.status} />
    if (col.fmt) return col.fmt(value, row)
    return value as ReactNode
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder={`Buscar ${entityLabel}...`}
            aria-label={`Buscar ${entityLabel}`}
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
                    c.primary && "sticky left-0 z-10 bg-card min-w-[220px]",
                  )}
                >
                  {c.sortable ? (
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
              <TableRow key={r.id} onClick={() => onRowClick(r)} className="cursor-pointer">
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    className={cn(
                      c.align === "right" && "text-right font-mono tabular-nums",
                      c.primary && "sticky left-0 z-10 bg-card font-medium text-foreground",
                    )}
                  >
                    {renderCell(c, r)}
                  </TableCell>
                ))}
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  {onDrill && drillLabel ? (
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onDrill(r)}>
                      {drillLabel} <ChevronRight className="size-3.5" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onRowClick(r)}>
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
          {filtered.length} {entityLabel}(s) · página {current} de {totalPages}
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
