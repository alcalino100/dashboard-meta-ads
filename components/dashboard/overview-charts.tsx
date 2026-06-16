"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { fmtCompact, fmtCurrency } from "@/lib/format"

type TrendPoint = { date: string; gasto: number; cliques: number; mensagens: number; custoMsg: number }
type SharePoint = { name: string; gasto: number; mensagens: number }

function TooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 tabular-nums text-muted-foreground">
          <span className="inline-block size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-medium text-popover-foreground">{p.value.toLocaleString("pt-BR")}</span>
        </p>
      ))}
    </div>
  )
}

export function OverviewCharts({ trend, accountShare }: { trend: TrendPoint[]; accountShare: SharePoint[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Tendência diária</CardTitle>
          <CardDescription>Gasto, cliques, mensagens e custo por mensagem</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trend} margin={{ left: -8, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="gGasto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={fmtCompact} />
              <Tooltip content={<TooltipBox />} />
              <Area isAnimationActive={false} type="monotone" dataKey="gasto" name="Gasto" stroke="var(--chart-1)" fill="url(#gGasto)" strokeWidth={2} />
              <Line isAnimationActive={false} type="monotone" dataKey="cliques" name="Cliques" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
              <Line isAnimationActive={false} type="monotone" dataKey="mensagens" name="Mensagens" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              <Line isAnimationActive={false} type="monotone" dataKey="custoMsg" name="Custo/msg" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participação por conta</CardTitle>
          <CardDescription>Gasto consolidado</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={accountShare} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={fmtCompact} />
              <YAxis type="category" dataKey="name" width={84} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} formatter={(v: number) => fmtCurrency(v)} />
              <Bar isAnimationActive={false} dataKey="gasto" name="Gasto" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
