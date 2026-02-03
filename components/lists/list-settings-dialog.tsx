import { useState } from "react"
import { Settings, Smile } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { Twemoji } from "@/components/ui/twemoji"
import { updateList } from "@/lib/queries"
import { toast } from "sonner"
import type { List } from "@/lib/types"

interface ListSettingsDialogProps {
  list: List
  onUpdate: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ListSettingsDialog({ list, onUpdate, open, onOpenChange }: ListSettingsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    name: list.name,
    description: list.description || "",
    icon: list.icon || "📋",
    show_places: list.show_places ?? true,
    show_reviews: list.show_reviews ?? true,
    is_ordered: list.is_ordered ?? false,
  })

  const handleSave = async () => {
    setLoading(true)
    try {
        await updateList(list.id, {
            name: settings.name,
            description: settings.description || null,
            icon: settings.icon,
            show_places: settings.show_places,
            show_reviews: settings.show_reviews,
            is_ordered: settings.is_ordered,
        })
        toast.success("Configurações atualizadas")
        onUpdate()
        onOpenChange(false)
    } catch (error) {
        console.error(error)
        toast.error("Erro ao atualizar configurações")
    } finally {
        setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações da Lista</DialogTitle>
          <DialogDescription>
            Personalize os detalhes e aparência da sua lista.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
                <div className="flex gap-4 items-start">
                    <div className="space-y-2">
                        <Label>Ícone</Label>
                        <EmojiPicker 
                            value={settings.icon} 
                            onChange={(emoji) => setSettings(prev => ({ ...prev, icon: emoji }))}
                            trigger={
                                <Button variant="outline" className="h-24 w-24 rounded-xl flex items-center justify-center text-4xl">
                                    <Twemoji emoji={settings.icon} />
                                </Button>
                            }
                        />
                    </div>
                    <div className="space-y-2 flex-1">
                        <Label htmlFor="name">Nome da Lista</Label>
                        <Input 
                            id="name" 
                            value={settings.name} 
                            onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Melhores Cafés"
                        />
                         <p className="text-xs text-muted-foreground">O nome que aparecerá no topo da lista.</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Bio / Descrição</Label>
                    <Textarea 
                        id="description" 
                        value={settings.description} 
                        onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Uma breve descrição sobre do que se trata esta lista..."
                        className="resize-none h-20"
                    />
                </div>
            </div>

            <div className="border-t border-border/50 my-4" />

            {/* Toggles */}
            <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                    <Label htmlFor="show_places">Mostrar Lugares</Label>
                    <p className="text-sm text-muted-foreground">Exibir a aba de lugares nesta lista.</p>
                </div>
                <Switch 
                    id="show_places" 
                    checked={settings.show_places} 
                    onCheckedChange={(c) => setSettings(prev => ({ ...prev, show_places: c }))} 
                />
            </div>
            
             <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                    <Label htmlFor="show_reviews">Mostrar Reviews</Label>
                    <p className="text-sm text-muted-foreground">Exibir a aba de reviews nesta lista.</p>
                </div>
                <Switch 
                    id="show_reviews" 
                    checked={settings.show_reviews} 
                    onCheckedChange={(c) => setSettings(prev => ({ ...prev, show_reviews: c }))} 
                />
            </div>
            
             <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                    <Label htmlFor="is_ordered">Lista Ordenada</Label>
                    <p className="text-sm text-muted-foreground">Exibir números de ordem nos itens.</p>
                </div>
                <Switch 
                    id="is_ordered" 
                    checked={settings.is_ordered} 
                    onCheckedChange={(c) => setSettings(prev => ({ ...prev, is_ordered: c }))} 
                />
            </div>
        </div>
        
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading || !settings.name.trim()}>
                {loading ? 'Salvando...' : 'Salvar'}
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
