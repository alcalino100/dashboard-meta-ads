"use client"

import { useState } from "react"
import { Sparkles, Mail, Lock, ArrowLeft, ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

type View = "login" | "recover"

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  toggle,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  icon: React.ComponentType<{ className?: string }>
  toggle?: boolean
}) {
  const [show, setShow] = useState(false)
  const inputType = toggle ? (show ? "text" : "password") : type
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
          className={cn("pl-9", toggle && "pr-9", error && "border-destructive")}
        />
        {toggle && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function AuthScreens() {
  const { state, signIn } = useAuth()
  const [view, setView] = useState<View>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const expired = state === "expired"

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes("@")) return setError("E-mail inválido.")
    if (password.length < 6) return setError("Senha deve ter ao menos 6 caracteres.")
    setError("")
    setSubmitting(true)
    const ok = await signIn(email, password)
    setSubmitting(false)
    if (!ok) setError("E-mail ou senha incorretos.")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Garcia&apos;s Gestão de Tráfego</h1>
            <p className="text-sm text-muted-foreground">Gestão multi-conta Meta Ads</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {expired && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-warning/20 bg-warning/10 p-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-xs text-foreground">
                Sua sessão expirou por inatividade. Faça login novamente para continuar.
              </p>
            </div>
          )}

          {view === "login" && (
            <form onSubmit={submitLogin} className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Entrar</h2>
                <p className="text-sm text-muted-foreground">Acesse seu painel operacional</p>
              </div>
              <Field id="email" label="E-mail" type="email" value={email} onChange={setEmail} placeholder="nome@empresa.com" icon={Mail} />
              <Field id="password" label="Senha" value={password} onChange={setPassword} placeholder="••••••••" icon={Lock} toggle />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full gap-1.5" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />} Entrar
              </Button>
              <button
                type="button"
                onClick={() => { setView("recover"); setError("") }}
                className="text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Esqueceu a senha?
              </button>
            </form>
          )}

          {view === "recover" && (
            <div className="flex flex-col gap-4">
              <button type="button" onClick={() => { setView("login"); setError("") }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-3.5" /> Voltar
              </button>
              <div>
                <h2 className="text-base font-semibold text-foreground">Esqueceu a senha?</h2>
                <p className="text-sm text-muted-foreground">Sua senha é definida pelo administrador</p>
              </div>
              <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/50 p-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-xs text-foreground">
                  Peça ao administrador da conta para gerar uma nova senha para você em{" "}
                  <span className="font-medium">Usuários</span>. Ele poderá definir uma senha
                  temporária e repassá-la com segurança.
                </p>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={() => { setView("login"); setError("") }}>
                Voltar ao login
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
