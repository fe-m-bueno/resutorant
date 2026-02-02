"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getProfile, updateProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";

// Schema just for onboarding - initially focusing on username
const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, "Username deve ter pelo menos 3 caracteres")
    .max(20, "Username deve ter no máximo 20 caracteres")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username pode conter apenas letras, números e underscore"
    ),
  // Can add bio/website here later if we want a fuller onboarding
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: "",
    },
  });

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      try {
        const profileData = await getProfile(user.id);
        if (profileData) {
          setProfile(profileData);
          // If they already have a username, they shouldn't be here
          if (profileData.username) {
            router.push("/dashboard");
            return;
          }
          form.reset({
            username: "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Erro ao carregar perfil");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [router, form]);

  const onSubmit = async (data: OnboardingFormData) => {
    if (!profile) return;

    setIsSaving(true);
    try {
      await updateProfile(profile.id, { username: data.username });
      toast.success("Perfil criado com sucesso!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao salvar perfil. O username pode já estar em uso.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Bem-vindo(a)!</h1>
          <p className="mt-2 text-muted-foreground">
            Para começar, escolha um nome de usuário único.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="seu_username" {...field} />
                  </FormControl>
                  <FormDescription>
                    Este será seu identificador único no app.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Continuar para o Dashboard"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
