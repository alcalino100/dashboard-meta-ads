"use client"

import { useEffect, useState } from "react"
import { Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"

export function SetupBanner() {
  const [needsSetup, setNeedsSetup] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    fetch("/api/store/connections")
      .then((r) => alive && setNeedsSetup(r.status === 503))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (!needsSetup) return null

  return (
    <div className="border-b border-warning/30 bg-warning/10 px-4 py-2.5 lg:px-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Wrench className="size-4 shrink-0 text-warning" />
        <p className="min-w-0 flex-1 text-sm text-foreground">
          <span className="font-medium">Configuração necessária:</span>{" "}
          adicione as variáveis de ambiente no painel da Vercel para ativar o banco de dados. Sem isso, nenhuma ação será salva.
        </p>
        <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={() => setOpen(true)}>
          Como configurar
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como configurar o banco de dados</DialogTitle>
            <DialogDescription>Três passos no painel da Vercel para ativar a persistência.</DialogDescription>
          </DialogHeader>
          <ol className="flex flex-col gap-3 py-2 text-sm">
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">1</span>
              <span>Abra a Vercel → <span className="font-medium">Settings</span> → <span className="font-medium">Environment Variables</span>.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">2</span>
              <span>
                Adicione{" "}
                <code className="rounded bg-secondary px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
                <code className="rounded bg-secondary px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> e{" "}
                <code className="rounded bg-secondary px-1 py-0.5 text-xs">SUPABASE_SERVICE_ROLE_KEY</code>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">3</span>
              <span>Faça o <span className="font-medium">Redeploy</span> — o banner desaparece automaticamente.</span>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </div>
  )
}
