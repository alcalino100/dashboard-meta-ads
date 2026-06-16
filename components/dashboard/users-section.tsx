"use client"

import { useState } from "react"
import { Check, X, UserPlus, MoreHorizontal, Power, Send, KeyRound } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"
import { users, roles, accounts, permissionActions, permissionMatrix, accountPermissions } from "@/lib/mock-data"

const levelCfg = {
  full: { label: "Total", cls: "bg-success/15 text-success" },
  edit: { label: "Editar", cls: "bg-primary/15 text-primary" },
  view: { label: "Ver", cls: "bg-secondary text-secondary-foreground" },
  none: { label: "—", cls: "bg-muted text-muted-foreground/60" },
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("")
}

export function UsersSection() {
  const [inviteError, setInviteError] = useState("")
  const [email, setEmail] = useState("")
  const [open, setOpen] = useState(false)

  const submitInvite = () => {
    if (!email.includes("@")) {
      setInviteError("Informe um e-mail válido.")
      return
    }
    setInviteError("")
    setEmail("")
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Usuários e permissões</h2>
          <p className="text-sm text-muted-foreground">Gerencie acessos por conta e por perfil</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <UserPlus className="size-4" /> Convidar usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar usuário</DialogTitle>
              <DialogDescription>Vincule permissões por conta de anúncio</DialogDescription>
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
                <Select defaultValue="Operador">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Contas vinculadas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {accounts.map((a, i) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-accent">
                      <input type="checkbox" defaultChecked={i < 2} className="size-4 accent-primary" />
                      {a.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={submitInvite}>Enviar convite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
              {users.map((u) => (
                <TableRow key={u.email}>
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
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{u.accounts}</TableCell>
                  <TableCell className="text-muted-foreground">{u.lastAccess}</TableCell>
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
                        <DropdownMenuItem><Power className="size-4" /> {u.status === "active" ? "Desativar" : "Ativar"}</DropdownMenuItem>
                        <DropdownMenuItem><Send className="size-4" /> Reenviar convite</DropdownMenuItem>
                        <DropdownMenuItem><KeyRound className="size-4" /> Resetar senha</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

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
                  {permissionActions.map((a) => (
                    <TableHead key={a} className="text-center text-xs">{a}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role}>
                    <TableCell className="font-medium text-foreground">{role}</TableCell>
                    {permissionMatrix[role].map((allowed, i) => (
                      <TableCell key={i} className="text-center">
                        {allowed ? (
                          <Check className="mx-auto size-4 text-success" />
                        ) : (
                          <X className="mx-auto size-4 text-muted-foreground/40" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Permissões por conta de anúncio</CardTitle>
          <CardDescription>Nível de acesso de cada usuário em cada conta vinculada</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[140px]">Usuário</TableHead>
                  {accounts.map((a) => (
                    <TableHead key={a.id} className="text-center text-xs">{a.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountPermissions.map((row) => (
                  <TableRow key={row.user}>
                    <TableCell className="font-medium text-foreground">{row.user}</TableCell>
                    {row.perAccount.map((p) => {
                      const cfg = levelCfg[p.level]
                      return (
                        <TableCell key={p.account} className="text-center">
                          <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-medium", cfg.cls)}>{cfg.label}</span>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
