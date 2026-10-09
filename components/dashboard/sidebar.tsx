"use client"

import {
  LayoutDashboard,
  Megaphone,
  ImageIcon,
  Briefcase,
  Plug,
  GitBranch,
  Bell,
  Target,
  Brain,
  Users,
  ScrollText,
  Settings,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { navItems, type NavItem } from "@/lib/mock-data"

const icons: Record<NavItem, React.ComponentType<{ className?: string }>> = {
  Overview: LayoutDashboard,
  Campanhas: Megaphone,
  Criativos: ImageIcon,
  Clientes: Briefcase,
  Integrações: Plug,
  Regras: GitBranch,
  Alertas: Bell,
  Metas: Target,
  Inteligência: Brain,
  Usuários: Users,
  Auditoria: ScrollText,
  Configurações: Settings,
}

const order: NavItem[] = [...navItems]

export function SidebarNav({
  active,
  onSelect,
  collapsed = false,
}: {
  active: NavItem
  onSelect: (item: NavItem) => void
  collapsed?: boolean
}) {
  const { isAdmin } = useAuth()
  const visible = order.filter((item) => item !== "Usuários" || isAdmin)
  return (
    <nav
      aria-label="Navegação principal"
      className="flex h-full flex-col gap-1 p-3"
    >
      <div className={cn("flex items-center gap-2 px-2 pb-4 pt-1", collapsed && "justify-center px-0")}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-semibold text-sidebar-foreground">Garcia&apos;s</p>
            <p className="text-xs text-muted-foreground">Gestão de Tráfego</p>
          </div>
        )}
      </div>

      {visible.map((item) => {
        const Icon = icons[item]
        const isActive = item === active
        return (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            aria-current={isActive ? "page" : undefined}
            aria-label={item}
            title={collapsed ? item : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              isActive && "bg-sidebar-accent text-sidebar-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className={cn("size-4 shrink-0", isActive && "text-primary")} />
            {!collapsed && <span className="truncate">{item}</span>}
          </button>
        )
      })}
    </nav>
  )
}
