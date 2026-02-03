"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ComponentProps } from "react"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"

import { createList, deleteList, getUserLists, updateList } from "@/lib/queries";
import { listSchema, type ListFormData } from "@/lib/schemas";
import type { List } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export function ListsManager() {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Separate form handler for creating/editing
  const form = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      is_public: true,
    },
  });

  const loadLists = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const userLists = await getUserLists(user.id);
        // exclude 'favorites' default list if we implement that logic differently,
        // but typically user manages all lists.
        setLists(userLists);
      }
    } catch (error) {
      console.error("Error loading lists:", error);
      toast.error("Erro ao carregar listas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  const onSubmit = async (data: ListFormData) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      if (editingList) {
        await updateList(editingList.id, data);
        toast.success("Lista atualizada!");
      } else {
        await createList({ ...data, user_id: user.id });
        toast.success("Lista criada!");
      }

      setIsDialogOpen(false);
      setEditingList(null);
      form.reset({
        name: "",
        description: "",
        icon: "",
        is_public: true,
      });
      loadLists();
    } catch (error) {
      console.error("Error saving list:", error);
      toast.error("Erro ao salvar lista");
    }
  };

  const startEditing = (list: List) => {
    setEditingList(list);
    form.reset({
      name: list.name,
      description: list.description || "",
      icon: list.icon || "",
      is_public: list.is_public,
    });
    setIsDialogOpen(true);
  };

  const openNewListDialog = () => {
      setEditingList(null);
      form.reset({
        name: "",
        description: "",
        icon: "",
        is_public: true,
      });
      setIsDialogOpen(true);
  }

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await deleteList(id, user.id);
      toast.success("Lista removida!");
      loadLists();
    } catch (error) {
      console.error("Error deleting list:", error);
      toast.error("Erro ao remover lista");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-2">
            <div className="grid gap-2">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Minhas Listas</h3>
        <Button size="sm" onClick={openNewListDialog} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Lista
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingList ? "Editar Lista" : "Nova Lista"}</DialogTitle>
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
                            <Input placeholder="Viagem cancelada, Favoritos..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Para onde fomos..." className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Ícone (Emoji)</FormLabel>
                        <FormControl>
                            <Input placeholder="✈️" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="is_public"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Pública</FormLabel>
                            <FormDescription>
                            Outras pessoas podem ver esta lista
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    <div className="flex justify-end gap-2">
                         <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                         <Button type="submit">Salvar</Button>
                    </div>
                </form>
              </Form>
          </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {lists.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Você ainda não tem listas personalizadas.
          </p>
        ) : (
          <div className="grid gap-2">
            {lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between rounded-lg border p-3 bg-card"
              >
                <div className="flex items-center gap-2">
                    <span className="text-xl">{list.icon || "📋"}</span>
                    <div>
                        <p className="font-medium">{list.name}</p>
                        {list.description && <p className="text-xs text-muted-foreground">{list.description}</p>}
                    </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(list)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                    {!list.is_default && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir lista?</AlertDialogTitle>
                                <AlertDialogDescription>
                                Essa ação não pode ser desfeita e removerá a lista de todos os locais associados.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(list.id)}
                                >
                                Excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
