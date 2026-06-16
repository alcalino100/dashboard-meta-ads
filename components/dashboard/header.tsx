"use client"

import { Search, Plus, Download, RefreshCw, Upload, Menu, LogOut, TimerOff, User, GitCompareArrows } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useFilters } from "@/lib/filters-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DateFilter } from "./date-filter"
import { AccountFilter } from "./account-filter"

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { signOut, expire } = useAuth()
  const { compare } = useFilters()
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

        <div className="hidden flex-wrap items-center gap-2 md:flex">
          <AccountFilter />
          <DateFilter />
          {compare && (
            <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary">
              <GitCompareArrows className="size-3.5" /> Comparando
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="sm" className="h-9 gap-1.5" />}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">Ações</span>
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
            <DropdownMenuTrigger
              aria-label="Menu da conta"
              className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-9 border border-border">
                <AvatarFallback className="bg-secondary text-xs">RM</AvatarFallback>
              </Avatar>
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
