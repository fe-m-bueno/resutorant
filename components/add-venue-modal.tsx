'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MapPin, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { venueSchema, type VenueFormData, VENUE_TYPES } from '@/lib/schemas';
import {
  createVenue,
  getCuisineTypes,
  createCuisine,
} from '@/lib/queries';
import type { CuisineType } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface AddVenueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  currentUserId?: string;
}

const venueTypeLabels: Record<string, string> = {
  restaurante: 'Restaurante',
  café: 'Café',
  bar: 'Bar',
  lanchonete: 'Lanchonete',
  delivery: 'Delivery',
  mercado: 'Mercado',
  bistrô: 'Bistrô',
  izakaya: 'Izakaya',
  rotisseria: 'Rotisseria',
  padaria: 'Padaria',
  pub: 'Pub',
};

export function AddVenueModal({
  open,
  onOpenChange,
  onSuccess,
  currentUserId,
}: AddVenueModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableCuisines, setAvailableCuisines] = useState<CuisineType[]>([]);
  const [isLoadingCuisines, setIsLoadingCuisines] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingCuisine, setIsCreatingCuisine] = useState(false);

  // If currentUserId is not passed, try to get it
  useEffect(() => {
    if (!currentUserId && open) {
        // This is a fallback, preferably pass it from parent
    }
  }, [currentUserId, open]);

  const filteredCuisines = availableCuisines.filter((cuisine) =>
    cuisine.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const form = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: '',
      type: 'restaurante',
      location: {
        city: '',
        neighborhood: '',
      },
      cuisine_ids: [],
    },
  });

  useEffect(() => {
    if (open) {
      loadCuisines();
      form.reset({
        name: '',
        type: 'restaurante',
        location: { city: '', neighborhood: '' },
        cuisine_ids: [],
      });
    }
  }, [open, currentUserId]);

  const loadCuisines = async () => {
    try {
      setIsLoadingCuisines(true);
      // We need a user ID for getCuisineTypes usually to show user-specific ones if applicable,
      // but here we just want all or defaults. If getCuisineTypes requires user_id, we need it.
      // Looking at EditVenueModal, it passes currentUserId.
      if (currentUserId) {
        const data = await getCuisineTypes(currentUserId);
        setAvailableCuisines(data);
      }
    } catch (error) {
      console.error('Error loading cuisines:', error);
      // toast.error('Erro ao carregar culinárias');
    } finally {
      setIsLoadingCuisines(false);
    }
  };

  const handleCreateCuisine = async () => {
    if (!currentUserId || !searchQuery.trim()) return;

    try {
      setIsCreatingCuisine(true);
      const newCuisine = await createCuisine({
        name: searchQuery.trim(),
        created_by: currentUserId,
      });

      setAvailableCuisines((prev) => [...prev, newCuisine].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Auto-select
      const currentIds = form.getValues('cuisine_ids') || [];
      form.setValue('cuisine_ids', [...currentIds, newCuisine.id]);
      
      setSearchQuery('');
      toast.success('Culinária criada com sucesso!');
    } catch (error) {
      console.error('Error creating cuisine:', error);
      toast.error('Erro ao criar culinária');
    } finally {
      setIsCreatingCuisine(false);
    }
  };

  const onSubmit = async (data: VenueFormData) => {
    if (!currentUserId) {
        toast.error("Você precisa estar logado.");
        return;
    }

    setIsSubmitting(true);
    try {
      await createVenue({
        ...data,
        created_by: currentUserId
      });
      toast.success('Local adicionado com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao adicionar local.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Local</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
              name="cuisine_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Culinária</FormLabel>
                  <div className="space-y-3 p-3 border rounded-md">
                    <div className="flex gap-2">
                       <div className="relative flex-1">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar ou adicionar culinária..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (filteredCuisines.length === 0 && searchQuery) handleCreateCuisine();
                                }
                            }}
                          />
                       </div>
                       {searchQuery && !availableCuisines.some(c => c.name.toLowerCase() === searchQuery.toLowerCase().trim()) && (
                          <Button
                             type="button"
                             size="icon"
                             variant="outline"
                             onClick={handleCreateCuisine}
                             disabled={isCreatingCuisine || !currentUserId}
                          >
                             {isCreatingCuisine ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          </Button>
                       )}
                    </div>

                    <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1">
                      {isLoadingCuisines ? (
                        <div className="flex justify-center p-2">
                           <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        filteredCuisines.map((cuisine) => (
                           <div key={cuisine.id} className="flex items-center space-x-2 p-1 hover:bg-accent rounded">
                             <Checkbox
                                id={`new-cuisine-${cuisine.id}`}
                                checked={field.value?.includes(cuisine.id)}
                                onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    field.onChange(checked ? [...current, cuisine.id] : current.filter(id => id !== cuisine.id));
                                }}
                             />
                             <Label htmlFor={`new-cuisine-${cuisine.id}`} className="flex-1 cursor-pointer text-sm font-normal">
                                {cuisine.name}
                             </Label>
                           </div>
                        ))
                      )}
                      {!isLoadingCuisines && filteredCuisines.length === 0 && (
                          <div className="text-center text-xs text-muted-foreground py-2">
                             {searchQuery ? 'Nenhuma culinária encontrada' : 'Nenhuma culinária disponível'}
                          </div>
                      )}
                    </div>

                    {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                           {field.value.map(id => {
                              const cuisine = availableCuisines.find(c => c.id === id);
                              if (!cuisine) return null;
                              return (
                                 <Badge key={id} variant="secondary" className="text-xs">
                                    {cuisine.name}
                                    <button type="button" className="ml-1 hover:text-destructive" onClick={() => field.onChange(field.value?.filter(i => i !== id))}>
                                       <X className="h-3 w-3" />
                                    </button>
                                 </Badge>
                              );
                           })}
                        </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location.neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Itaim Bibi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar Local'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
