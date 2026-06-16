"use client"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { AuthScreens } from "@/components/auth/auth-screens"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

function Gate() {
  const { state } = useAuth()
  if (state !== "authenticated") return <AuthScreens />
  return <DashboardShell />
}

export default function Page() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
