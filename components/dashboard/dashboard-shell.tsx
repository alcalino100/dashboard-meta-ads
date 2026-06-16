"use client"

import { useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { SidebarNav } from "./sidebar"
import { Header } from "./header"
import { OverviewSection } from "./overview-section"
import { CampaignsSection } from "./campaigns-section"
import { UsersSection } from "./users-section"
import { AlertsSection } from "./alerts-section"
import { PlaceholderSection } from "./placeholder-section"
import type { NavItem } from "@/lib/mock-data"

export function DashboardShell() {
  const [active, setActive] = useState<NavItem>("Overview")
  const [mobileOpen, setMobileOpen] = useState(false)

  const select = (item: NavItem) => {
    setActive(item)
    setMobileOpen(false)
  }

  const renderSection = () => {
    switch (active) {
      case "Overview":
        return <OverviewSection />
      case "Campanhas":
        return <CampaignsSection />
      case "Usuários":
        return <UsersSection />
      case "Alertas":
        return <AlertsSection />
      default:
        return <PlaceholderSection title={active} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
        <SidebarNav active={active} onSelect={select} />
      </aside>

      {/* Sidebar mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 bg-sidebar p-0">
          <SidebarNav active={active} onSelect={select} />
        </SheetContent>
      </Sheet>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">{renderSection()}</main>
      </div>
    </div>
  )
}
