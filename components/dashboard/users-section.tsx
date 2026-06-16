"use client"

import { useState } from "react"
import { Check, X, UserPlus, MoreHorizontal, Power, Trash2, Users } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { roles, permissionActions, permissionMatrix, type Role } from "@/lib/mock-data"
import { useUsers, createItem, deleteItem, patchItem, type AppUser } from "@/lib/use-store"
import { useFilters } from "@/lib/filters-context"
import { LoadingState, ErrorState, DataEmptyState } from "./states"

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("")
}

function timeAgo(iso: string | null) {
  if (!iso) return "Nunca"
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "Agora"
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)} dia(s)`
}

export function UsersSection() {
  const { users, isLoading, error } = useUsers()
  const { accounts } = useFilters()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("Operador")
  const [picked, setPicked] = useState<string[]>([])
  const [formError, setFormError] = useState("")

  const toggleAccount = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const submitInvite = async () => {
    if (!name.trim()) return setFormError("Informe o nome.")
    if (!email.includes("@")) return setFormError("Informe um e-mail válido.")
    setFormError("")
    setSaving(true)
    try {
      await createItem("users", {
        name,
        email,
        role,
        account_ids: picked,
        status: "active",
        last_access: null,
      })
      setName(""); setEmail(""); setPicked([]); setRole("Operador"); setOpen(false)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao convidar")
    } finally {
      setSaving(false)
    }
  }

  const accName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Usuários e permissões</h2>
          <p className="text-sm text-muted-foreground">Gerencie acessos por conta e por perfil</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><UserPlus className="size-4" /> Convidar usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar usuário</DialogTitle>
              <DialogDescription>Vincule permissões por conta de anúncio</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">E-mail</Label>
                <Input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@empresa.com" aria-invalid={!!formError}
                  className={cn(formError && "border-destructive")}
                />
                {formError && <p className="text-xs text-destructive">{formError}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Nível de acesso</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Contas vinculadas</Label>
                <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
                  {accounts.map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-accent">
                      <input
                        type="checkbox" checked={picked.includes(a.id)} onChange={() => toggleAccount(a.id)}
                        className="size-4 accent-primary"
                      />
                      <span className="truncate">{a.name}</span>
                    </label>
                  ))}
                  {accounts.length === 0 && <p className="col-span-2 text-xs text-muted-foreground">Nenhuma conta Meta conectada.</p>}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={submitInvite} disabled={saving}>{saving ? "Enviando..." : "Enviar convite"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <LoadingState label="Carregando usuários..." />
      ) : error ? (
        <ErrorState message="Não foi possível carregar os usuários." />
      ) : users.length === 0 ? (
        <DataEmptyState
          icon={Users}
          title="Nenhum usuário cadastrado"
          description="Convide membros da equipe e vincule cada um às contas de anúncio que pode acessar."
          actionLabel="Convidar primeiro usuário"
          onAction={() => setOpen(true)}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Nível de acesso</TableHead>
                  <TableHead className="text-right">Contas</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u: AppUser) => (
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
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{u.account_ids?.length ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">{timeAgo(u.last_access)}</TableCell>
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
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7" aria-label={`Ações de ${u.name}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => patchItem("users", { id: u.id, status: u.status === "active" ? "inactive" : "active" })}
                          >
                            <Power className="size-4" /> {u.status === "active" ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteItem("users", u.id)}
                          >
                            <Trash2 className="size-4" /> Remover
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

      <Card className="overflow-hidden p-0">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Matriz de permissões</CardTitle>
          <CardDescription>Ações permitidas por perfil de acesso</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[120px]">Perfil</TableHead>
                  {permissionActions.map((a) => <TableHead key={a} className="text-center text-xs">{a}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r}>
                    <TableCell className="font-medium text-foreground">{r}</TableCell>
                    {permissionMatrix[r].map((allowed, i) => (
                      <TableCell key={i} className="text-center">
                        {allowed ? <Check className="mx-auto size-4 text-success" /> : <X className="mx-auto size-4 text-muted-foreground/40" />}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {users.length > 0 && (
        <Card className="overflow-hidden p-0">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Acesso por conta de anúncio</CardTitle>
            <CardDescription>Contas vinculadas a cada usuário</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[140px]">Usuário</TableHead>
                    <TableHead>Contas vinculadas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: AppUser) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-foreground">{u.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {(u.account_ids ?? []).length === 0 ? (
                            <span className="text-xs text-muted-foreground">Sem contas vinculadas</span>
                          ) : (
                            u.account_ids.map((id) => (
                              <span key={id} className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{accName(id)}</span>
                            ))
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
