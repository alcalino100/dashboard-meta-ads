"use client"

import { useMemo, useState } from "react"
import {
  Search,
  ArrowUpDown,
  Play,
  Pause,
  Copy,
  Trash2,
  Archive,
  MoreHorizontal,
  X,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { campaigns as allCampaigns, accounts, type Campaign } from "@/lib/mock-data"
import { fmtCurrency, fmtNumber, fmtPercent } from "@/lib/format"
import { StatusBadge } from "./status-badge"
import { CampaignDrawer } from "./campaign-drawer"

type SortKey = keyof Pick<Campaign, "name" | "spend" | "cpc" | "ctr" | "messages" | "costPerMsg">

const PER_PAGE = 8

export function CampaignsTable() {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("Todos")
  const [objective, setObjective] = useState("Todos")
  const [account, setAccount] = useState("Todas")
  const [sortKey, setSortKey] = useState<SortKey>("spend")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [active, setActive] = useState<Campaign | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filtered = useMemo(() => {
    const statusMap: Record<string, string> = { Ativo: "active", Pausado: "paused", Encerrado: "ended", "Em análise": "review" }
    return allCampaigns
      .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
      .filter((c) => status === "Todos" || c.status === statusMap[status])
      .filter((c) => objective === "Todos" || c.objective === objective)
      .filter((c) => account === "Todas" || c.account === account)
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1
        const va = a[sortKey]
        const vb = b[sortKey]
        if (typeof va === "string") return va.localeCompare(vb as string) * dir
        return ((va as number) - (vb as number)) * dir
      })
  }, [query, status, objective, account, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const current = Math.min(page, totalPages)
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) rows.forEach((r) => next.delete(r.id))
      else rows.forEach((r) => next.add(r.id))
      return next
    })

  const openDrawer = (c: Campaign) => {
    setActive(c)
    setDrawerOpen(true)
  }

  const SortHead = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      <ArrowUpDown className={cn("size-3", sortKey === k ? "text-primary" : "text-muted-foreground/50")} />
    </button>
  )

  return (
    <Card className="gap-0 overflow-hidden p-0">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar campanha..."
            aria-label="Buscar campanha"
            className="h-9 border-border bg-secondary/40 pl-9"
          />
        </div>
        <FilterSelect label="Status" value={status} onChange={setStatus} items={["Todos", "Ativo", "Pausado", "Encerrado", "Em análise"]} />
        <FilterSelect label="Objetivo" value={objective} onChange={setObjective} items={["Todos", "Mensagens", "Conversões", "Tráfego", "Alcance", "Engajamento"]} />
        <FilterSelect label="Conta" value={account} onChange={setAccount} items={["Todas", ...accounts.map((a) => a.name)]} />
      </div>

      {/* Barra de ações em massa */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground tabular-nums">{selected.size} selecionada(s)</span>
          <div className="ml-auto flex flex-wrap gap-1.5">
            <BulkBtn icon={Play} label="Ativar" />
            <BulkBtn icon={Pause} label="Pausar" />
            <BulkBtn icon={Copy} label="Duplicar" />
            <BulkBtn icon={Archive} label="Arquivar" />
            <BulkBtn icon={Trash2} label="Excluir" danger />
            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setSelected(new Set())}>
              <X className="size-3.5" /> Limpar
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAll}
                  aria-label="Selecionar todas"
                  className="size-4 accent-primary"
                />
              </TableHead>
              <TableHead className="min-w-[220px]"><SortHead label="Campanha" k="name" /></TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right"><SortHead label="Gasto" k="spend" /></TableHead>
              <TableHead className="text-right">Impressões</TableHead>
              <TableHead className="text-right">Cliques</TableHead>
              <TableHead className="text-right"><SortHead label="CPC" k="cpc" /></TableHead>
              <TableHead className="text-right"><SortHead label="CTR" k="ctr" /></TableHead>
              <TableHead className="text-right"><SortHead label="Mensagens" k="messages" /></TableHead>
              <TableHead className="text-right"><SortHead label="Custo/msg" k="costPerMsg" /></TableHead>
              <TableHead className="text-right">Orçamento</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="h-32 text-center text-sm text-muted-foreground">
                  Nenhuma campanha encontrada com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
            {rows.map((c) => (
              <TableRow
                key={c.id}
                onClick={() => openDrawer(c)}
                className={cn("cursor-pointer", selected.has(c.id) && "bg-primary/5")}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleRow(c.id)}
                    aria-label={`Selecionar ${c.name}`}
                    className="size-4 accent-primary"
                  />
                </TableCell>
                <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.account}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell className="text-right font-mono tabular-nums">{fmtCurrency(c.spend)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{fmtNumber(c.impressions)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{fmtNumber(c.clicks)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{fmtCurrency(c.cpc)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{fmtPercent(c.ctr)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{fmtNumber(c.messages)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{fmtCurrency(c.costPerMsg)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{fmtCurrency(c.budget)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7" aria-label="Ações da campanha">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Pause className="size-4" /> Pausar</DropdownMenuItem>
                      <DropdownMenuItem><Copy className="size-4" /> Duplicar</DropdownMenuItem>
                      <DropdownMenuItem><Archive className="size-4" /> Arquivar</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive"><Trash2 className="size-4" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground tabular-nums">
          {filtered.length} campanha(s) · página {current} de {totalPages}
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

      <CampaignDrawer campaign={active} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </Card>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  items: string[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-9 w-auto min-w-[130px] gap-1 border-border bg-secondary/40 text-xs">
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((it) => (
          <SelectItem key={it} value={it} className="text-xs">{it}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function BulkBtn({ icon: Icon, label, danger }: { icon: React.ComponentType<{ className?: string }>; label: string; danger?: boolean }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("h-8 gap-1.5", danger && "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive")}
    >
      <Icon className="size-3.5" />
      {label}
    </Button>
  )
}
