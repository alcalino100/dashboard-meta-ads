export const fmtCurrency = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export const fmtNumber = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })

export const fmtPercent = (n: number) =>
  `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`

export const fmtCompact = (n: number) =>
  n.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 })

export function fmtByType(value: number, type: string) {
  if (type === "currency") return fmtCurrency(value)
  if (type === "percent") return fmtPercent(value)
  return fmtNumber(value)
}

export const deltaPct = (cur: number, prev: number) =>
  +(((cur - prev) / prev) * 100).toFixed(1)
