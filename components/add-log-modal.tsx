"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, MapPin, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { RatingInput } from "@/components/rating-input"
import { TagSelector } from "@/components/tag-selector"

import { createLogSchema, type CreateLogFormData, VENUE_TYPES } from "@/lib/schemas"
import { createLog, getTags, getCuisineTypes, searchVenues, createTag } from "@/lib/queries"
import { createClient } from "@/lib/supabase/client"
import type { Tag, CuisineType, Venue } from "@/lib/types"

interface AddLogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const venueTypeLabels: Record<string, string> = {
  restaurante: "Restaurante",
  café: "Café",
  bar: "Bar",
  lanchonete: "Lanchonete",
  delivery: "Delivery",
  mercado: "Mercado",
  bistrô: "Bistrô",
  izakaya: "Izakaya",
  rotisseria: "Rotisseria",
  padaria: "Padaria",
  pub: "Pub",
}

export function AddLogModal({ open, onOpenChange, onSuccess }: AddLogModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [cuisines, setCuisines] = useState<CuisineType[]>([])
  const [venueSearch, setVenueSearch] = useState("")
  const [venueResults, setVenueResults] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [isNewVenue, setIsNewVenue] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const form = useForm({
    resolver: zodResolver(createLogSchema),
    defaultValues: {
      rating: 3,
      is_private: false,
      tag_ids: [],
      cuisine_ids: [],
      visited_at: "",
    },
  })

  // Load user and initial data
  useEffect(() => {
    if (!open) return

    if (!form.getValues("visited_at")) {
      form.setValue("visited_at", format(new Date(), "yyyy-MM-dd"))
    }

    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserId(user.id)
        const [tagsData, cuisinesData] = await Promise.all([
          getTags(user.id),
          getCuisineTypes(user.id),
        ])
        setTags(tagsData)
        setCuisines(cuisinesData)
      }
    }

    loadData()
  }, [open, form])

  // Search venues
  useEffect(() => {
    if (venueSearch.length < 2) {
      setVenueResults([])
      return
    }

    const timeout = setTimeout(async () => {
      const results = await searchVenues(venueSearch)
      setVenueResults(results)
    }, 300)

    return () => clearTimeout(timeout)
  }, [venueSearch])

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue)
    setIsNewVenue(false)
    form.setValue("venue_id", venue.id)
    form.setValue("venue_name", undefined)
    setVenueSearch(venue.name)
    setVenueResults([])
  }

  const handleCreateNewVenue = () => {
    setSelectedVenue(null)
    setIsNewVenue(true)
    form.setValue("venue_id", undefined)
    form.setValue("venue_name", venueSearch)
  }

  const handleCreateTag = async (name: string): Promise<Tag> => {
    if (!userId) throw new Error("User not logged in")
    const newTag = await createTag({
      name,
      color: "#6366f1",
      created_by: userId,
    })
    setTags((prev) => [...prev, newTag])
    return newTag
  }

  const onSubmit = async (data: CreateLogFormData) => {
    if (!userId) {
      toast.error("Você precisa estar logado")
      return
    }

    setIsSubmitting(true)
    try {
      await createLog(userId, data)
      toast.success("Log criado com sucesso!")
      form.reset()
      setSelectedVenue(null)
      setVenueSearch("")
      setIsNewVenue(false)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao criar log. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    form.reset()
    setSelectedVenue(null)
    setVenueSearch("")
    setIsNewVenue(false)
    setVenueResults([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Novo Log</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Venue Search/Create */}
            <div className="space-y-3">
              <Label>Local</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ou criar local..."
                  value={venueSearch}
                  onChange={(e) => {
                    setVenueSearch(e.target.value)
                    if (selectedVenue) setSelectedVenue(null)
                  }}
                  className="pl-9"
                />
              </div>

              {/* Search results */}
              {venueResults.length > 0 && !selectedVenue && (
                <div className="border rounded-xl overflow-hidden divide-y">
                  {venueResults.map((venue) => (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => handleVenueSelect(venue)}
                      className="w-full px-3 py-2.5 text-left hover:bg-muted transition-colors"
                    >
                      <p className="font-medium text-sm">{venue.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {venueTypeLabels[venue.type]}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Create new venue option */}
              {venueSearch.length >= 2 &&
                !selectedVenue &&
                !venueResults.some(
                  (v) => v.name.toLowerCase() === venueSearch.toLowerCase()
                ) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCreateNewVenue}
                    className="w-full"
                  >
                    Criar &quot;{venueSearch}&quot;
                  </Button>
                )}

              {/* New venue form */}
              {isNewVenue && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-xl">
                  <FormField
                    control={form.control}
                    name="venue_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {VENUE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {venueTypeLabels[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="venue_location.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: São Paulo" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="venue_location.neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Vila Madalena" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cuisines for new venue */}
                  <div>
                    <Label className="mb-2 block">Culinária</Label>
                    <TagSelector
                      tags={cuisines.map((c) => ({
                        id: c.id,
                        name: `${c.icon ?? ""} ${c.name}`.trim(),
                        color: "#f59e0b",
                        created_at: c.created_at,
                        created_by: c.created_by,
                      }))}
                      selectedIds={form.watch("cuisine_ids") ?? []}
                      onChange={(ids) => form.setValue("cuisine_ids", ids)}
                      placeholder="Adicionar culinária..."
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel>Nota</FormLabel>
                  <FormControl>
                    <RatingInput
                      value={field.value}
                      onChange={field.onChange}
                      size="lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Review text */}
            <FormField
              control={form.control}
              name="text_review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentário (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Como foi sua experiência?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div>
              <Label className="mb-2 block">Tags</Label>
              <TagSelector
                tags={tags}
                selectedIds={form.watch("tag_ids") ?? []}
                onChange={(ids) => form.setValue("tag_ids", ids)}
                onCreateTag={handleCreateTag}
                placeholder="Adicionar tags..."
              />
            </div>

            {/* Date and Privacy */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visited_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da visita</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_private"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibilidade</FormLabel>
                    <FormControl>
                      <Button
                        type="button"
                        variant={field.value ? "secondary" : "outline"}
                        className="w-full justify-start gap-2"
                        onClick={() => field.onChange(!field.value)}
                      >
                        {field.value ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Privado
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Público
                          </>
                        )}
                      </Button>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleReset}
              >
                Limpar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Log"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
