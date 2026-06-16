"use client"

import { Building2 } from "lucide-react"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useFilters } from "@/lib/filters-context"

export function AccountFilter() {
  const { account, setAccount, accounts, accountsLoading } = useFilters()

  return (
    <Select value={account} onValueChange={setAccount}>
      <SelectTrigger
        aria-label="Conta de anúncio"
        className="h-9 w-auto min-w-[180px] gap-1.5 border-border bg-secondary/40 text-xs"
      >
        <Building2 className="size-4 text-muted-foreground" />
        <SelectValue placeholder={accountsLoading ? "Carregando..." : "Conta"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="text-xs">Todas as contas</SelectItem>
        {accounts.map((a) => (
          <SelectItem key={a.id} value={a.id} className="text-xs">
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
