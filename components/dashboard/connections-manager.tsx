"use client"

import { useState } from "react"
import {
  Plug, Plus, RefreshCw, Trash2, Pencil, CheckCircle2, AlertTriangle, XCircle, Loader2, Lock,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
  useConnections, createItem, patchItem, deleteItem, testConnection, type Connection,
} from "@/lib/use-store"
import { CONNECTION_STATUS, TONE_CLS, fmtDateTime } from "@/lib/connection-status"
import { LoadingState, ErrorState, DataEmptyState } from "./states"

const toneIcon = { success: CheckCircle2, warning: AlertTriangle, destructive: XCircle }

function StatusBadge({ status }: { status: Connection["status"] }) {
  const cfg = CONNECTION_STATUS[status] ?? CONNECTION_STATUS.sync_error
  const Icon = toneIcon[cfg.tone]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium", TONE_CLS[cfg.tone])}>
      <Icon className="size-3.5" /> {cfg.label}
    </span>
  )
}

type FormState = { name: string; business_id: string; app_id: string; access_token: string }
const EMPTY: FormState = { name: "", business_id: "", app_id: "", access_token: "" }

export function ConnectionsManager() {
  const { connections, isLoading, error } = useConnections()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Connection | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [testingId, setTestingId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Connection | null>(null)

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY)
    setFormError("")
    setDialogOpen(true)
  }

  const openEdit = (c: Connection) => {
    setEditing(c)
    setForm({ name: c.name, business_id: c.business_id ?? "", app_id: c.app_id ?? "", access_token: "" })
    setFormError("")
    setDialogOpen(true)
  }

  const submit = async () => {
    if (!form.name.trim()) return setFormError("Informe um nome para a conexão.")
    setFormError("")
    setSaving(true)
    try {
      if (editing) {
        await patchItem("connections", {
          id: editing.id,
          name: form.name,
          business_id: form.business_id || null,
          app_id: form.app_id || null,
          ...(form.access_token ? { access_token: form.access_token } : {}),
        })
      } else {
        if (!form.access_token.trim()) {
          setSaving(false)
          return setFormError("Informe o token de acesso da nova conexão.")
        }
        await createItem("connections", {
          name: form.name,
          business_id: form.business_id || null,
          app_id: form.app_id || null,
          access_token: form.access_token,
          status: "connected",
        })
      }
      setDialogOpen(false)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar conexão")
    } finally {
      setSaving(false)
    }
  }

  const runTest = async (c: Connection) => {
    setTestingId(c.id)
    try {
      await testConnection(c.id)
    } finally {
      setTestingId(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteItem("connections", toDelete.id)
    } catch (e) {
      // erro exibido via toast não disponível; ignora silenciosamente, lista permanece
      console.log("[v0] delete connection error:", e instanceof Error ? e.message : e)
    } finally {
      setToDelete(null)
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="flex-row items-center justify-between gap-2 p-4">
        <div>
          <CardTitle className="text-base">Conexões Meta</CardTitle>
          <CardDescription>Crie, edite, teste e remova conexões com o Business Manager</CardDescription>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="size-4" /> Nova conexão
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isLoading ? (
          <LoadingState label="Carregando conexões..." />
        ) : error ? (
          <ErrorState message="Não foi possível carregar as conexões." />
        ) : connections.length === 0 ? (
          <DataEmptyState
            icon={Plug}
            title="Nenhuma conexão configurada"
            description="Conecte um Business Manager da Meta para sincronizar contas, campanhas e métricas reais."
            actionLabel="Adicionar conexão"
            onAction={openNew}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {connections.map((c) => {
              const cfg = CONNECTION_STATUS[c.status] ?? CONNECTION_STATUS.sync_error
              return (
                <li key={c.id} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md border", TONE_CLS[cfg.tone])}>
                      <Plug className="size-5" />
                    </span>
                    <div className="min-w-0 leading-tight">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        {c.uses_env_token && (
                          <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                            <Lock className="size-3" /> Principal
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">
                        App {c.app_id ?? "—"}{c.business_id ? ` · BM ${c.business_id}` : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <StatusBadge status={c.status} />
                        <span>Sync: {fmtDateTime(c.last_sync_at)}</span>
                        <span>Teste: {fmtDateTime(c.last_test_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => runTest(c)} disabled={testingId === c.id}>
                      {testingId === c.id ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                      Verificar
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 text-muted-foreground" aria-label={`Editar ${c.name}`} onClick={() => openEdit(c)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="size-8 text-muted-foreground hover:text-destructive disabled:opacity-40"
                      aria-label={`Excluir ${c.name}`}
                      disabled={c.uses_env_token}
                      onClick={() => setToDelete(c)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar conexão" : "Nova conexão Meta"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize os dados da conexão." : "Informe os dados do Business Manager e o token de acesso."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Colucci Imob" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Business ID</Label>
                <Input value={form.business_id} onChange={(e) => setForm({ ...form, business_id: e.target.value })} placeholder="opcional" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">App ID</Label>
                <Input value={form.app_id} onChange={(e) => setForm({ ...form, app_id: e.target.value })} placeholder="opcional" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Token de acesso{editing ? " (deixe em branco para manter)" : ""}</Label>
              <Input
                type="password" value={form.access_token}
                onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                placeholder={editing && editing.uses_env_token ? "Gerenciado pelo ambiente" : "EAAB..."}
                disabled={!!editing?.uses_env_token}
              />
              {editing?.uses_env_token && (
                <p className="text-xs text-muted-foreground">Esta conexão usa o token seguro do ambiente e não pode ser alterada aqui.</p>
              )}
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={submit} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar" : "Criar conexão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conexão?</AlertDialogTitle>
            <AlertDialogDescription>
              {`A conexão "${toDelete?.name}" será removida. Regras vinculadas a ela também serão excluídas e metas associadas ficarão órfãs. Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
