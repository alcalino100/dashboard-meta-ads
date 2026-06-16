"use client"

import { Suspense } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { FiltersProvider } from "@/lib/filters-context"
import { AuthScreens } from "@/components/auth/auth-screens"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

function Gate() {
  const { state } = useAuth()
  if (state !== "authenticated") return <AuthScreens />
  return (
    <Suspense fallback={null}>
      <FiltersProvider>
        <DashboardShell />
      </FiltersProvider>
    </Suspense>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
