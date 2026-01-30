"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Camera, Loader2, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { BottomNav } from "@/components/bottom-nav"
import { AddLogModal } from "@/components/add-log-modal"
import { getProfile, updateProfile } from "@/lib/queries"
import { createClient } from "@/lib/supabase/client"
import { profileSchema, type ProfileFormData } from "@/lib/schemas"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      bio: "",
      website: "",
    },
  })

  const loadProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push("/auth/login")
      return
    }
    
    setIsLoading(true)
    try {
      const profileData = await getProfile(user.id)
      setProfile(profileData)
      
      if (profileData) {
        form.reset({
          username: profileData.username ?? "",
          bio: profileData.bio ?? "",
          website: profileData.website ?? "",
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast.error("Erro ao carregar perfil")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile) return
    
    setIsSaving(true)
    try {
      const updated = await updateProfile(profile.id, data)
      setProfile(updated)
      toast.success("Perfil atualizado com sucesso!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Erro ao atualizar perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header - only visible on lg+ */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 z-40 h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-8">
        <Link
          href="/protected/profile"
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Configurações</h1>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 glass border-b border-border/30">
        <div className="mx-auto flex h-14 max-w-md items-center gap-4 px-4">
          <Link
            href="/protected/profile"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">Configurações</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 lg:pt-16 pb-24 lg:pb-8">
        <div className="mx-auto max-w-md px-4 py-6 lg:max-w-3xl lg:px-8">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-muted" />
              <div className="h-10 w-32 rounded-lg bg-muted" />
            </div>
            <div className="space-y-4">
              <div className="h-10 w-full rounded-lg bg-muted" />
              <div className="h-20 w-full rounded-lg bg-muted" />
              <div className="h-10 w-full rounded-lg bg-muted" />
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Avatar Section */}
              <section className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xl">
                      {profile?.username?.charAt(0).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
                    onClick={() => toast.info("Upload de avatar em breve!")}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <p className="font-medium">@{profile?.username ?? "usuário"}</p>
                  <p className="text-sm text-muted-foreground">
                    Toque no ícone para alterar a foto
                  </p>
                </div>
              </section>

              <Separator />

              {/* Profile Fields */}
              <section className="space-y-4">
                <h2 className="text-base font-semibold">Informações do Perfil</h2>
                
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
                        Apenas letras, números e underscore
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Conte um pouco sobre você..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Máximo de 160 caracteres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://seusite.com"
                          {...field}
                        />
                      </FormControl>
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
                    "Salvar alterações"
                  )}
                </Button>
              </section>

              <Separator />

              {/* App Settings */}
              <section className="space-y-4">
                <h2 className="text-base font-semibold">Aparência</h2>
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-medium">Tema</p>
                    <p className="text-sm text-muted-foreground">
                      Escolha entre claro, escuro ou sistema
                    </p>
                  </div>
                  <ThemeSwitcher />
                </div>
              </section>

              <Separator />

              {/* Account Actions */}
              <section className="space-y-4">
                <h2 className="text-base font-semibold">Conta</h2>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sair da conta
                </Button>
              </section>
            </form>
          </Form>
        )}
        </div>
      </main>

      <BottomNav onAddClick={() => setIsModalOpen(true)} />
      
      <AddLogModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={loadProfile}
      />
    </div>
  )
}
