"use client"

import { useState } from "react"
import { Sparkles, Mail, Lock, ArrowLeft, ShieldCheck, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAuth, DEFAULT_CREDENTIAL } from "@/lib/auth-context"

type View = "login" | "recover" | "first-access"

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
  const [email, setEmail] = useState(DEFAULT_CREDENTIAL.email)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const expired = state === "expired"

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes("@")) return setError("E-mail inválido.")
    if (password.length < 6) return setError("Senha deve ter ao menos 6 caracteres.")
    setError("")
    const ok = signIn(email, password)
    if (!ok) setError("E-mail ou senha incorretos.")
  }

  const submitRecover = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes("@")) return setError("Informe um e-mail válido.")
    setError("")
    setSent(true)
  }

  const submitFirst = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return setError("A senha deve ter ao menos 8 caracteres.")
    if (password !== confirm) return setError("As senhas não coincidem.")
    setError("")
    signIn(email, password)
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
              <Button type="submit" className="w-full">Entrar</Button>
              <button
                type="button"
                onClick={() => { setView("recover"); setError(""); setSent(false) }}
                className="text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Esqueceu a senha?
              </button>
            </form>
          )}

          {view === "recover" && (
            <form onSubmit={submitRecover} className="flex flex-col gap-4">
              <button type="button" onClick={() => { setView("login"); setError(""); setSent(false) }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-3.5" /> Voltar
              </button>
              <div>
                <h2 className="text-base font-semibold text-foreground">Recuperar senha</h2>
                <p className="text-sm text-muted-foreground">Enviaremos um link de redefinição</p>
              </div>
              {sent ? (
                <div className="flex items-start gap-2 rounded-md border border-success/20 bg-success/10 p-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <p className="text-xs text-foreground">Link enviado para <span className="font-medium">{email}</span>. Verifique sua caixa de entrada.</p>
                </div>
              ) : (
                <>
                  <Field id="recover-email" label="E-mail" type="email" value={email} onChange={setEmail} placeholder="nome@empresa.com" icon={Mail} error={error} />
                  <Button type="submit" className="w-full">Enviar link</Button>
                </>
              )}
            </form>
          )}

          {view === "first-access" && (
            <form onSubmit={submitFirst} className="flex flex-col gap-4">
              <button type="button" onClick={() => { setView("login"); setError("") }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-3.5" /> Voltar
              </button>
              <div>
                <h2 className="text-base font-semibold text-foreground">Primeiro acesso</h2>
                <p className="text-sm text-muted-foreground">Defina sua senha para ativar a conta</p>
              </div>
              <Field id="new-pass" label="Nova senha" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" icon={Lock} toggle />
              <Field id="confirm-pass" label="Confirmar senha" value={confirm} onChange={setConfirm} placeholder="Repita a senha" icon={Lock} toggle error={error} />
              <Button type="submit" className="w-full">Ativar conta</Button>
            </form>
          )}
        </div>

        {view === "login" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Recebeu um convite?{" "}
            <button onClick={() => { setView("first-access"); setError(""); setPassword(""); setConfirm("") }} className="font-medium text-primary hover:underline">
              Definir senha de primeiro acesso
            </button>
          </p>
        )}
      </div>
    </main>
  )
}
