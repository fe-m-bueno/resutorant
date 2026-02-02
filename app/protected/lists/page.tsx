"use client"

import { useState, useEffect } from "react"
import { Plus, List as ListIcon, Globe, Lock, MoreHorizontal, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BottomNav } from "@/components/bottom-nav"
import { AddLogModal } from "@/components/add-log-modal"
import { getUserLists, createList, getListWithVenues } from "@/lib/queries"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { List } from "@/lib/types"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { listSchema, type ListFormData } from "@/lib/schemas"

// List Card Component
function ListCard({ 
  list, 
  venueCount 
}: { 
  list: List
  venueCount: number 
}) {
  return (
    <div className="group relative rounded-2xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            {list.icon ? (
              <span className="text-lg">{list.icon}</span>
            ) : (
              <ListIcon className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium truncate">{list.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{venueCount} {venueCount === 1 ? 'lugar' : 'lugares'}</span>
              {list.is_public ? (
                <span className="flex items-center gap-0.5">
                  <Globe className="h-3 w-3" />
                  Pública
                </span>
              ) : (
                <span className="flex items-center gap-0.5">
                  <Lock className="h-3 w-3" />
                  Privada
                </span>
              )}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {list.description && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {list.description}
        </p>
      )}
      
      {list.is_default && (
        <span className="absolute top-2 right-2 text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          Padrão
        </span>
      )}
    </div>
  )
}

// List Card Skeleton
function ListCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// Create List Modal Component
function CreateListModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      is_public: true,
    },
  })
  
  const onSubmit = async (data: ListFormData) => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Você precisa estar logado")
        return
      }
      
      await createList({
        user_id: user.id,
        name: data.name,
        description: data.description || undefined,
        icon: data.icon || undefined,
        is_public: data.is_public,
      })
      
      toast.success("Lista criada com sucesso!")
      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error creating list:", error)
      toast.error("Erro ao criar lista")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Lista</DialogTitle>
          <DialogDescription>
            Crie uma lista para organizar seus lugares favoritos
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da lista</Label>
            <Input
              id="name"
              placeholder="Ex: Favoritos, Quero visitar..."
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              placeholder="Uma breve descrição da lista"
              {...form.register("description")}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="icon">Emoji (opcional)</Label>
            <Input
              id="icon"
              placeholder="🍕"
              className="w-20"
              maxLength={2}
              {...form.register("icon")}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_public"
              checked={form.watch("is_public")}
              onCheckedChange={(checked) => form.setValue("is_public", checked === true)}
            />
            <Label htmlFor="is_public" className="text-sm font-normal cursor-pointer">
              Lista pública (visível para outros usuários)
            </Label>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar lista"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ListsPage() {
  const [lists, setLists] = useState<List[]>([])
  const [venueCounts, setVenueCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false)
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    setIsLoading(true)
    try {
      const listsData = await getUserLists(user.id)
      setLists(listsData)
      
      // Fetch venue counts for each list
      const counts: Record<string, number> = {}
      await Promise.all(
        listsData.map(async (list) => {
          const listWithVenues = await getListWithVenues(list.id)
          counts[list.id] = listWithVenues?.venues?.length ?? 0
        })
      )
      setVenueCounts(counts)
    } catch (error) {
      console.error("Error loading lists:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 z-40 h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-8">
        <div>
          <h1 className="text-lg font-semibold">Minhas Listas</h1>
        </div>
        <Button onClick={() => setIsCreateListModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Lista
        </Button>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 glass border-b border-border/30">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Minhas Listas</h1>
          <Button size="sm" onClick={() => setIsCreateListModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 lg:pt-16 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl px-4 lg:px-8 py-6 lg:py-8">
          <div className="grid gap-3 lg:gap-4 animate-in">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <ListCardSkeleton key={i} />
              ))
            ) : lists.length > 0 ? (
              lists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  venueCount={venueCounts[list.id] ?? 0}
                />
              ))
            ) : (
              <div className="text-center py-16 px-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                  <ListIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-xl mb-2">
                  Nenhuma lista ainda
                </h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Crie listas para organizar seus lugares favoritos, locais que quer visitar e muito mais
                </p>
                <Button onClick={() => setIsCreateListModalOpen(true)} size="lg">
                  Criar primeira lista
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav onAddClick={() => setIsAddLogModalOpen(true)} />
      
      <AddLogModal
        open={isAddLogModalOpen}
        onOpenChange={setIsAddLogModalOpen}
        onSuccess={loadData}
      />
      
      <CreateListModal
        open={isCreateListModalOpen}
        onOpenChange={setIsCreateListModalOpen}
        onSuccess={loadData}
      />
    </div>
  )
}
