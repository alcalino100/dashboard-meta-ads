"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Building2, Plus, Pencil, Trash2, Loader2, Plug } from "lucide-react"
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
import { useClients, useConnections, createItem, patchItem, deleteItem, type Client } from "@/lib/use-store"
import { LoadingState, ErrorState, DataEmptyState } from "./states"

type FormState = { name: string; document: string; email: string; phone: string; notes: string; status: "active" | "inactive" }
const EMPTY: FormState = { name: "", document: "", email: "", phone: "", notes: "", status: "active" }

export function ClientsSection() {
  const { clients, isLoading, error } = useClients()
  const { connections } = useConnections()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [toDelete, setToDelete] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openNew = () => { setEditing(null); setForm(EMPTY); setFormError(""); setDialogOpen(true) }
  const openEdit = (c: Client) => {
    setEditing(c)
    setForm({
      name: c.name, document: c.document ?? "", email: c.email ?? "",
      phone: c.phone ?? "", notes: c.notes ?? "", status: c.status,
    })
    setFormError("")
    setDialogOpen(true)
  }

  const submit = async () => {
    if (!form.name.trim()) return setFormError("Informe o nome do cliente.")
    setFormError("")
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        document: form.document.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim() || null,
        status: form.status,
      }
      if (editing) await patchItem("clients", { id: editing.id, ...payload })
      else await createItem("clients", payload)
      setDialogOpen(false)
      toast.success(editing ? "Cliente atualizado" : "Cliente criado")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar cliente"
      setFormError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteItem("clients", toDelete.id)
      toast.success("Cliente removido (conexões dele ficaram sem vínculo)")
      setToDelete(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover cliente")
    } finally {
      setDeleting(false)
    }
  }

  const connsOf = (id: string) => connections.filter((c) => c.client_id === id)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Clientes</h2>
          <p className="text-sm text-muted-foreground">
            Cada cliente tem seu próprio App + token — as contas de anúncio seguem a conexão ativa dele
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="size-4" /> Novo cliente
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Carteira ({clients.length})</CardTitle>
          <CardDescription>Vincule as conexões Meta a cada cliente em Integrações</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {isLoading ? (
            <LoadingState label="Carregando clientes..." />
          ) : error ? (
            <ErrorState message="Não foi possível carregar os clientes." />
          ) : clients.length === 0 ? (
            <DataEmptyState
              icon={Building2}
              title="Nenhum cliente cadastrado"
              description="Cadastre seu primeiro cliente e vincule o App + token dele em Integrações."
              actionLabel="Adicionar cliente"
              onAction={openNew}
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {clients.map((c) => {
                const conns = connsOf(c.id)
                return (
                  <li key={c.id} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/40">
                        <Building2 className="size-5 text-primary" />
                      </span>
                      <div className="min-w-0 leading-tight">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{c.name}</p>
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            c.status === "active" ? "bg-success/15 text-success" : "bg-secondary text-secondary-foreground",
                          )}>
                            {c.status === "active" ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[c.email, c.phone, c.document].filter(Boolean).join(" · ") || "—"}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Plug className="size-3" />
                          {conns.length === 0
                            ? "Sem conexão vinculada"
                            : `${conns.length} conexão(ões): ${conns.map((x) => x.name).join(", ")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button size="icon" variant="ghost" className="size-8 text-muted-foreground" aria-label={`Editar ${c.name}`} onClick={() => openEdit(c)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Excluir ${c.name}`}
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
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            <DialogDescription>O App + token deste cliente são vinculados em Integrações.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Colucci Imob" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Documento</Label>
                <Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} placeholder="CNPJ/CPF" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">E-mail</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@cliente.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Observações</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex.: token vence em..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })}
                className="rounded-md border border-border bg-background px-2 py-2 text-sm"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={submit} disabled={saving}>{saving ? "Salvando..." : editing ? "Salvar" : "Criar cliente"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${toDelete?.name}" será removido. As conexões dele serão mantidas, mas ficarão sem vínculo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); confirmDelete() }}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />} Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
