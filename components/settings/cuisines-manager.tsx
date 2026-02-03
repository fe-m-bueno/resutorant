'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import {
  createCuisine,
  deleteCuisine,
  getUserCreatedCuisines,
  updateCuisine,
} from '@/lib/queries';
import type { CuisineType } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Twemoji } from '@/components/ui/twemoji';

// Inline schema since it's simple and specific to this form
const cuisineFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(30, 'Nome muito longo'),
  icon: z.string().optional(),
});

type CuisineFormData = z.infer<typeof cuisineFormSchema>;

export function CuisinesManager() {
  const [cuisines, setCuisines] = useState<CuisineType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<CuisineFormData>({
    resolver: zodResolver(cuisineFormSchema),
    defaultValues: {
      name: '',
      icon: '',
    },
  });

  const loadCuisines = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const userCuisines = await getUserCreatedCuisines(user.id);
        setCuisines(userCuisines);
      }
    } catch (error) {
      console.error('Error loading cuisines:', error);
      toast.error('Erro ao carregar culinárias');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCuisines();
  }, []);

  const onSubmit = async (data: CuisineFormData) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      if (editingId) {
        await updateCuisine(editingId, data);
        toast.success('Culinária atualizada!');
        setEditingId(null);
      } else {
        await createCuisine({ ...data, created_by: user.id });
        toast.success('Culinária criada!');
      }

      form.reset({ name: '', icon: '' });
      loadCuisines();
    } catch (error) {
      console.error('Error saving cuisine:', error);
      toast.error('Erro ao salvar culinária');
    }
  };

  const startEditing = (cuisine: CuisineType) => {
    setEditingId(cuisine.id);
    form.reset({
      name: cuisine.name,
      icon: cuisine.icon || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    form.reset({ name: '', icon: '' });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCuisine(id);
      toast.success('Culinária removida!');
      loadCuisines();
    } catch (error) {
      console.error('Error deleting cuisine:', error);
      toast.error('Erro ao remover culinária');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="font-semibold text-lg">
          {editingId ? 'Editar Culinária' : 'Nova Culinária'}
        </h3>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-start gap-4"
          >
            <div className="flex-1 space-y-4 md:flex md:space-y-0 md:gap-4 h-auto">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Nome (ex: Italiana)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormControl>
                      <EmojiPicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="icon">
                {editingId ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={cancelEditing}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Minhas Culinárias</h3>
        {cuisines.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Você ainda não criou nenhuma culinária personalizada.
          </p>
        ) : (
          <div className="grid gap-2">
            {cuisines.map((cuisine) => (
              <div
                key={cuisine.id}
                className="flex items-center justify-between rounded-lg border p-3 bg-card"
              >
                <div className="flex items-center gap-2">
                  <Twemoji emoji={cuisine.icon || '🍽️'} className="h-5 w-5" />
                  <span className="font-medium">{cuisine.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(cuisine)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir culinária?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(cuisine.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
