"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
import { Badge } from "@/components/ui/badge";

import { createTag, deleteTag, getUserCreatedTags, updateTag } from "@/lib/queries";
import { tagSchema, type TagFormData } from "@/lib/schemas";
import type { Tag } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export function TagsManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
      color: "#6366f1",
    },
  });

  const loadTags = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const userTags = await getUserCreatedTags(user.id);
        setTags(userTags);
      }
    } catch (error) {
      console.error("Error loading tags:", error);
      toast.error("Erro ao carregar tags");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const onSubmit = async (data: TagFormData) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      if (editingId) {
        await updateTag(editingId, data);
        toast.success("Tag atualizada!");
        setEditingId(null);
      } else {
        await createTag({ ...data, created_by: user.id });
        toast.success("Tag criada!");
      }

      form.reset({ name: "", color: "#6366f1" });
      loadTags();
    } catch (error) {
      console.error("Error saving tag:", error);
      toast.error("Erro ao salvar tag");
    }
  };

  const startEditing = (tag: Tag) => {
    setEditingId(tag.id);
    form.reset({
      name: tag.name,
      color: tag.color || "#6366f1",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    form.reset({ name: "", color: "#6366f1" });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTag(id);
      toast.success("Tag removida!");
      loadTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error("Erro ao remover tag");
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
        <h3 className="font-semibold text-lg">{editingId ? "Editar Tag" : "Nova Tag"}</h3>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-start gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Nome da tag" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="h-10 w-12 p-1"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" size="icon">
                {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" size="icon" onClick={cancelEditing}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Minhas Tags</h3>
        {tags.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Você ainda não criou nenhuma tag personalizada.
          </p>
        ) : (
          <div className="grid gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between rounded-lg border p-3 bg-card"
              >
                <Badge
                  style={{
                    backgroundColor: tag.color || "var(--primary)",
                    color: "#fff",
                  }}
                  className="text-base px-3 py-1"
                >
                  {tag.name}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(tag)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir tag?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não pode ser desfeita. A tag será removida de todas as avaliações.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(tag.id)}
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
