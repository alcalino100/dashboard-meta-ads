"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { UserPlus, MoreHorizontal, Power, Trash2, Users, Pencil, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
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
import { useAuth } from "@/lib/auth-context"
import { useAdminUsers, createUser, updateUser, deleteUser, type AppUser } from "@/lib/use-store"
import { LoadingState, ErrorState } from "./states"

const ROLES = ["Administrador", "Gestor", "Operador", "Somente leitura"]

const ROLE_HINT: Record<string, string> = {
  Administrador: "Acesso total, incluindo gestão de usuários e conexões.",
  Gestor: "Edita campanhas, metas e regras. Não gerencia usuários.",
  Operador: "Edita o operacional do dia a dia (metas, regras).",
  "Somente leitura": "Apenas visualiza os dados, sem editar nada.",
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function genPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789@#$%"
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

function fmtAccess(iso: string | null) {
  if (!iso) return "Nunca acessou"
  const d = new Date(iso)
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

type FormState = {
  id?: string
  name: string
  email: string
  password: string
  role: string
  account_ids: string[]
  status: "active" | "inactive"
}

const EMPTY: FormState = { name: "", email: "", password: "", role: "Operador", account_ids: [], status: "active" }

export function UsersSection() {
  const { getToken, isAdmin } = useAuth()
  const { accounts } = useFilters()

  const [token, setToken] = useState<string | null>(null)
  useEffect(() => {
    getToken().then((t) => setToken(t ?? ""))
  }, [getToken])
  const { users, isLoading, error } = useAdminUsers(token || null)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<AppUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  if (!isAdmin) {
    return (
      <Card className="items-center gap-4 p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full border bg-secondary text-muted-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Acesso restrito</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Apenas administradores podem gerenciar usuários e níveis de acesso.
          </p>
        </div>
      </Card>
    )
  }

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))
  const toggleAccount = (id: string) =>
    set({ account_ids: form.account_ids.includes(id) ? form.account_ids.filter((x) => x !== id) : [...form.account_ids, id] })

  const openCreate = () => {
    setEditing(false)
    setForm({ ...EMPTY, password: genPassword() })
    setShowPw(true)
    setFormError("")
    setOpen(true)
  }

  const openEdit = (u: AppUser) => {
    setEditing(true)
    setForm({ id: u.id, name: u.name, email: u.email, password: "", role: u.role, account_ids: u.account_ids, status: u.status })
    setShowPw(false)
    setFormError("")
    setOpen(true)
  }

  const submit = async () => {
    if (!token) return
    if (!form.name.trim()) return setFormError("Informe o nome.")
    if (!form.email.includes("@")) return setFormError("Informe um e-mail válido.")
    if (!editing && form.password.length < 8) return setFormError("A senha deve ter ao menos 8 caracteres.")
    if (editing && form.password && form.password.length < 8) return setFormError("A nova senha deve ter ao menos 8 caracteres.")
    setFormError("")
    setSaving(true)
    try {
      if (editing) {
        await updateUser(token, {
          id: form.id,
          name: form.name,
          role: form.role,
          account_ids: form.account_ids,
          status: form.status,
          ...(form.password ? { password: form.password } : {}),
        })
        toast.success("Usuário atualizado")
      } else {
        await createUser(token, {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          account_ids: form.account_ids,
        })
        toast.success("Usuário cadastrado")
      }
      setOpen(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar usuário"
      setFormError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (u: AppUser) => {
    if (!token) return
    setBusyId(u.id)
    const next = u.status === "active" ? "inactive" : "active"
    try {
      await updateUser(token, { id: u.id, status: next })
      toast.success(next === "active" ? "Usuário ativado" : "Usuário desativado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar usuário")
    } finally {
      setBusyId(null)
    }
  }

  const removeUser = async () => {
    if (!toDelete || !token) return
    setDeleting(true)
    try {
      await deleteUser(token, toDelete.id)
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
          <p className="text-sm text-muted-foreground">
            Cadastre acessos com e-mail e senha, definindo o nível de cada pessoa
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" className="gap-1.5" onClick={openCreate} />}>
            <UserPlus className="size-4" /> Novo usuário
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar usuário" : "Cadastrar usuário"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Atualize o nível de acesso, as contas e, se quiser, defina uma nova senha."
                  : "Defina e-mail e senha. O usuário já poderá entrar com essas credenciais."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Nome</Label>
                <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Nome completo" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  disabled={editing}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="nome@empresa.com"
                />
                {editing && <p className="text-xs text-muted-foreground">O e-mail de login não pode ser alterado.</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">{editing ? "Nova senha (opcional)" : "Senha"}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set({ password: e.target.value })}
                      placeholder={editing ? "Deixe em branco para manter" : "Mínimo 8 caracteres"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => { set({ password: genPassword() }); setShowPw(true) }}>
                    Gerar
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Nível de acesso</Label>
                <Select value={form.role} onValueChange={(v) => set({ role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{ROLE_HINT[form.role]}</p>
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
                          checked={form.account_ids.includes(a.id)}
                          onChange={() => toggleAccount(a.id)}
                          className="size-4 accent-primary"
                        />
                        <span className="truncate">{a.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {formError && <p className="text-xs text-destructive">{formError}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button size="sm" className="gap-1.5" onClick={submit} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editing ? "Salvar" : "Cadastrar"}
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
              Cadastre um usuário com e-mail e senha para conceder acesso ao painel.
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
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            <Pencil className="size-4" /> Editar
                          </DropdownMenuItem>
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
              A credencial de login e o acesso ao painel serão excluídos imediatamente. Esta ação não pode ser desfeita.
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
