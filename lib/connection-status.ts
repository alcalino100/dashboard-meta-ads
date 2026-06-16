import type { ConnectionStatus } from "@/lib/use-store"

// Configuração visual única para os estados de saúde de conexão (spec Seção 7)
export const CONNECTION_STATUS: Record<
  ConnectionStatus,
  { label: string; tone: "success" | "warning" | "destructive"; desc: string }
> = {
  connected: { label: "Conectada e saudável", tone: "success", desc: "Token válido e contas acessíveis" },
  token_expired: { label: "Token expirado", tone: "destructive", desc: "Gere um novo token de acesso" },
  no_permission: { label: "Sem permissão", tone: "warning", desc: "Faltam escopos obrigatórios no token" },
  sync_error: { label: "Erro de sincronização", tone: "destructive", desc: "Falha ao consultar a Meta API" },
  no_accounts: { label: "Sem contas vinculadas", tone: "warning", desc: "Token válido, mas sem contas de anúncio" },
}

export const TONE_CLS: Record<"success" | "warning" | "destructive", string> = {
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/10 text-warning",
  destructive: "border-destructive/20 bg-destructive/10 text-destructive",
}

export function fmtDateTime(iso: string | null): string {
  if (!iso) return "Nunca"
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}
