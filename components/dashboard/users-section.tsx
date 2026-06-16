"use client"

import { useState } from "react"
import { toast } from "sonner"
import { UserPlus, MoreHorizontal, Power, Trash2, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFilters } from "@/lib/filters-context"
import { useUsers, createItem, patchItem, deleteItem, type AppUser } from "@/lib/use-store"
import { LoadingState, ErrorState } from "./states"

const ROLES = ["Administrador", "Gestor", "Operador", "Somente leitura"]

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function nameFromEmail(email: string) {
  const handle = email.split("@")[0]
  return handle
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ") || email
}

function fmtAccess(iso: string | null) {
  if (!iso) return "Convite pendente"
  const d = new Date(iso)
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export function UsersSection() {
  const { users, isLoading, error } = useUsers()
  const { accounts } = useFilters()

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("Operador")
  const [selected, setSelected] = useState<string[]>([])
  const [inviteError, setInviteError] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<AppUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const toggleAccount = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const submitInvite = async () => {
    if (!email.includes("@")) {
      setInviteError("Informe um e-mail válido.")
      return
    }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      setInviteError("Já existe um usuário com este e-mail.")
      return
    }
    setInviteError("")
    setSaving(true)
    try {
      await createItem("users", {
        name: nameFromEmail(email),
        email: email.toLowerCase(),
        role,
        account_ids: selected,
        status: "active",
        last_access: null,
      })
      setEmail("")
      setRole("Operador")
      setSelected([])
      setOpen(false)
      toast.success("Convite enviado")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao convidar usuário"
      setInviteError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (u: AppUser) => {
    setBusyId(u.id)
    const next = u.status === "active" ? "inactive" : "active"
    try {
      await patchItem("users", { id: u.id, status: next })
      toast.success(next === "active" ? "Usuário ativado" : "Usuário desativado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar usuário")
    } finally {
      setBusyId(null)
    }
  }

  const removeUser = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteItem("users", toDelete.id)
      toast.success("Acesso removido")
      setToDelete(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover usuário")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Usuários e permissões</h2>
          <p className="text-sm text-muted-foreground">Acesso concedido por convite, vinculado a contas reais da Meta</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
            <UserPlus className="size-4" /> Convidar usuário
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar usuário</DialogTitle>
              <DialogDescription>Vincule o nível de acesso e as contas de anúncio</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@empresa.com"
                  aria-invalid={!!inviteError}
                  className={cn(inviteError && "border-destructive")}
                />
                {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Nível de acesso</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Contas vinculadas</Label>
                {accounts.length === 0 ? (
                  <p className="rounded-md border border-border p-2 text-xs text-muted-foreground">
                    Nenhuma conta Meta disponível. Conecte uma conexão saudável em Integrações.
                  </p>
                ) : (
                  <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                    {accounts.map((a) => (
                      <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-accent">
                        <input
                          type="checkbox"
                          checked={selected.includes(a.id)}
                          onChange={() => toggleAccount(a.id)}
                          className="size-4 accent-primary"
                        />
                        <span className="truncate">{a.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={submitInvite} disabled={saving}>
                {saving ? "Enviando..." : "Enviar convite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <LoadingState label="Carregando usuários..." />
      ) : error ? (
        <ErrorState message="Não foi possível carregar os usuários." />
      ) : users.length === 0 ? (
        <Card className="items-center gap-4 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border bg-secondary text-muted-foreground">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Nenhum usuário cadastrado</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Convide um usuário por e-mail para conceder acesso ao painel. Os usuários aparecem aqui após o convite.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Nível de acesso</TableHead>
                  <TableHead>Contas vinculadas</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7 border border-border">
                          <AvatarFallback className="bg-secondary text-xs">{initials(u.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{u.role}</span>
                    </TableCell>
                    <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                      {u.account_ids.length === 0 ? "—" : `${u.account_ids.length} conta(s)`}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{fmtAccess(u.last_access)}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                        u.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                      )}>
                        <span className={cn("size-1.5 rounded-full", u.status === "active" ? "bg-success" : "bg-muted-foreground")} />
                        {u.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" className="size-7" aria-label={`Ações de ${u.name}`} />}
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleStatus(u)} disabled={busyId === u.id}>
                            {busyId === u.id ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />} {u.status === "active" ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setToDelete(u)}>
                            <Trash2 className="size-4" /> Remover acesso
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`Remover acesso de ${toDelete?.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário perderá o acesso ao painel imediatamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                removeUser()
              }}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />} Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
