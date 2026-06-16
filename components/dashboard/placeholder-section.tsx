import { Plug, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">Módulo em preparação para integração com a Meta</p>
      </div>
      <Card className="items-center gap-4 p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
          <Plug className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Conecte uma conta Meta para começar</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
            Este módulo exibirá dados reais assim que a integração com a Marketing API estiver ativa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plug className="size-4" /> Conectar conta Meta
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" /> Criar primeira campanha
          </Button>
        </div>
      </Card>
    </div>
  )
}
