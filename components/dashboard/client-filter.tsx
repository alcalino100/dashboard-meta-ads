"use client"

import { useState } from "react"
import { Building2, Loader2 } from "lucide-react"
import { mutate as globalMutate } from "swr"
import { toast } from "sonner"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useClients, useConnections, patchItem } from "@/lib/use-store"

// Seletor global de cliente: trocar de cliente ativa a conexão dele e
// recarrega o dashboard inteiro (overview, campanhas, criativos) com os
// dados reais daquele App + token.
export function ClientFilter() {
  const { clients } = useClients()
  const { connections } = useConnections()
  const [switching, setSwitching] = useState(false)

  const withConns = clients.filter((c) => connections.some((cn) => cn.client_id === c.id))
  const active = connections.find((c) => c.status === "connected")
  const activeClientId = active?.client_id ?? ""

  const switchClient = async (clientId: string) => {
    if (!clientId || clientId === activeClientId) return
    const target = connections
      .filter((c) => c.client_id === clientId && !c.uses_env_token)
      .sort((a, b) => (a.status === "connected" ? -1 : 0) - (b.status === "connected" ? -1 : 0))[0]
      ?? connections.find((c) => c.client_id === clientId)
    if (!target) {
      toast.error("Este cliente ainda não tem conexão vinculada")
      return
    }
    setSwitching(true)
    try {
      await Promise.all(
        connections
          .filter((c) => c.status === "connected" && c.id !== target.id)
          .map((c) => patchItem("connections", { id: c.id, status: "token_expired" })),
      )
      if (target.status !== "connected") {
        await patchItem("connections", { id: target.id, status: "connected" })
      }
      // Recarrega conexões + TODOS os dados da Meta com o token do novo cliente
      await globalMutate("/api/store/connections")
      await globalMutate((key) => typeof key === "string" && key.startsWith("/api/meta/"))
      const name = clients.find((c) => c.id === clientId)?.name ?? "cliente"
      toast.success(`Agora mostrando dados de ${name}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao trocar de cliente")
    } finally {
      setSwitching(false)
    }
  }

  if (withConns.length === 0) return null

  const label = clients.find((c) => c.id === activeClientId)?.name ?? "Selecionar cliente"

  return (
    <Select value={activeClientId} onValueChange={switchClient} disabled={switching}>
      <SelectTrigger
        aria-label="Cliente"
        className="h-9 w-auto min-w-[180px] gap-1.5 border-primary/30 bg-primary/10 text-xs"
      >
        {switching ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Building2 className="size-4 shrink-0 text-primary" />
        )}
        <span className="truncate font-medium">{label}</span>
        <SelectValue className="sr-only" />
      </SelectTrigger>
      <SelectContent>
        {clients.map((c) => {
          const has = connections.some((cn) => cn.client_id === c.id)
          return (
            <SelectItem key={c.id} value={c.id} disabled={!has} className="text-xs">
              {c.name}{!has ? " (sem conexão)" : ""}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
