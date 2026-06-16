import { cn } from "@/lib/utils"
import type { Status } from "@/lib/mock-data"

const map: Record<Status, { label: string; cls: string; dot: string }> = {
  active: { label: "Ativo", cls: "bg-success/15 text-success", dot: "bg-success" },
  paused: { label: "Pausado", cls: "bg-warning/15 text-warning", dot: "bg-warning" },
  ended: { label: "Encerrado", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  review: { label: "Em análise", cls: "bg-chart-4/15 text-chart-4", dot: "bg-chart-4" },
}

export function StatusBadge({ status }: { status: Status }) {
  const s = map[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", s.cls)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  )
}
