"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"

type StatusResp = {
  connected: boolean
  code?: number | null
  error?: string
  tokenType?: "system_user" | "user" | "unknown"
}

const STEPS = [
  "Acesse Meta Business Manager → Configurações → Usuários do Sistema",
  "Crie ou selecione um System User com perfil Admin",
  "Dê acesso a todos os Ad Accounts gerenciados",
  "Gere token com escopos: ads_read, ads_management, business_management",
  "Copie o token e cole na variável META_ACCESS_TOKEN na Vercel",
  "Faça Redeploy do projeto",
]

export function MetaStatusBanner() {
  const [status, setStatus] = useState<StatusResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/meta/status", { cache: "no-store" })
      const json = (await res.json()) as StatusResp
      setStatus(json)
    } catch {
      setStatus({ connected: false, error: "Falha ao verificar a conexão com a Meta." })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const test = async () => {
    setTesting(true)
    await load()
    setTesting(false)
  }

  if (loading) {
    return <div className="h-11 animate-pulse border-b border-border bg-muted/40" aria-hidden />
  }

  if (!status || status.connected) {
    // Conectado: avisa só se for token de usuário comum (temporário)
    if (status?.connected && status.tokenType === "user") {
      return (
        <div className="border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 lg:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <AlertTriangle className="size-4 shrink-0 text-yellow-600 dark:text-yellow-500" />
            <p className="min-w-0 flex-1 text-sm text-foreground">
              Você está usando um token temporário. Substitua por um System User Token permanente.
            </p>
            <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={() => setOpen(true)}>
              Como corrigir
            </Button>
          </div>
          <InstructionsDialog open={open} onOpenChange={setOpen} />
        </div>
      )
    }
    return null
  }

  const expired = status.code === 190

  return (
    <div
      className={
        expired
          ? "border-b border-warning/30 bg-warning/10 px-4 py-2.5 lg:px-6"
          : "border-b border-destructive/30 bg-destructive/10 px-4 py-2.5 lg:px-6"
      }
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <AlertTriangle className={`size-4 shrink-0 ${expired ? "text-warning" : "text-destructive"}`} />
        <p className="min-w-0 flex-1 text-sm text-foreground">
          {expired ? (
            <span className="font-medium">Token Meta expirado — o dashboard não pode carregar dados.</span>
          ) : (
            <>
              <span className="font-medium">Falha de conexão com a Meta.</span>{" "}
              {status.error ?? "Verifique a configuração do token."}
            </>
          )}
        </p>
        <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={test} disabled={testing}>
          {testing ? "Testando..." : "Testar conexão"}
        </Button>
        {expired && (
          <Button size="sm" className="h-7 shrink-0" onClick={() => setOpen(true)}>
            Como corrigir
          </Button>
        )}
      </div>
      <InstructionsDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

function InstructionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Como gerar um System User Token permanente</DialogTitle>
          <DialogDescription>Siga os passos abaixo no Meta Business Manager.</DialogDescription>
        </DialogHeader>
        <ol className="flex flex-col gap-3 py-2 text-sm">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  )
}
