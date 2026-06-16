"use client"

import { Search, Plus, Download, RefreshCw, Upload, Menu, LogOut, TimerOff, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { accounts } from "@/lib/mock-data"

function GlobalFilter({
  label,
  items,
  defaultValue,
}: {
  label: string
  items: string[]
  defaultValue: string
}) {
  return (
    <Select defaultValue={defaultValue}>
      <SelectTrigger
        aria-label={label}
        className="h-9 w-auto min-w-[120px] gap-1 border-border bg-secondary/40 text-xs"
      >
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((it) => (
          <SelectItem key={it} value={it} className="text-xs">
            {it}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { signOut, expire } = useAuth()
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={onToggleSidebar}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </Button>

        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Busca universal..."
            aria-label="Busca universal"
            className="h-9 border-border bg-secondary/40 pl-9"
          />
        </div>

        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          <GlobalFilter label="Período" items={["Hoje", "7 dias", "14 dias", "30 dias"]} defaultValue="14 dias" />
          <GlobalFilter label="Business" items={["Todos", ...new Set(accounts.map((a) => a.business))]} defaultValue="Todos" />
          <GlobalFilter label="Conta" items={["Todas", ...accounts.map((a) => a.name)]} defaultValue="Todas" />
          <GlobalFilter label="Status" items={["Todos", "Ativo", "Pausado", "Em análise"]} defaultValue="Todos" />
          <GlobalFilter label="Objetivo" items={["Todos", "Mensagens", "Conversões", "Tráfego", "Alcance"]} defaultValue="Todos" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Plus className="size-4" /> Nova campanha
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="size-4" /> Importar estrutura
              </DropdownMenuItem>
              <DropdownMenuItem>
                <RefreshCw className="size-4" /> Atualizar dados
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="size-4" /> Exportar CSV/PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Menu da conta" className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="size-9 border border-border">
                  <AvatarFallback className="bg-secondary text-xs">RM</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="size-4" /> Meu perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={expire}>
                <TimerOff className="size-4" /> Simular sessão expirada
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="size-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
