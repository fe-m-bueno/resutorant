'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, LogOut, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DeleteAccountDialog } from '@/components/delete-account-dialog';
import { ImageCropper } from '@/components/image-cropper';

import { getProfile, updateProfile } from '@/lib/queries';
import { createClient } from '@/lib/supabase/client';
import { profileSchema, type ProfileFormData } from '@/lib/schemas';
import type { Profile } from '@/lib/types';

export function ProfileManager() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      bio: '',
      website: '',
    },
  });

  const loadProfile = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    setIsLoading(true);
    try {
      const profileData = await getProfile(user.id);
      setProfile(profileData);

      if (profileData) {
        form.reset({
          username: profileData.username ?? '',
          bio: profileData.bio ?? '',
          website: profileData.website ?? '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const updated = await updateProfile(profile.id, data);
      setProfile(updated);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatar = async (file: File | Blob) => {
    if (!profile) return;

    setIsUploading(true);
    setCropModalOpen(false);

    try {
      // 0. Clean up old avatar if exists
      if (profile.avatar_url) {
        try {
          const oldUrl = new URL(profile.avatar_url);
          const pathParts = oldUrl.pathname.split('/user_images/');
          if (pathParts.length > 1) {
            const oldPath = pathParts[1];
            await createClient().storage.from('user_images').remove([oldPath]);
          }
        } catch (e) {
          console.error('Error deleting old avatar:', e);
          // Continue with upload even if delete fails
        }
      }

      // 1. Upload to Supabase Storage
      const supabase = createClient();
      // Determine extension based on type, default to jpg
      let fileExt = 'jpg';
      if (file.type === 'image/gif') fileExt = 'gif';
      else if (file.type === 'image/png') fileExt = 'png';

      const filePath = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('user_images').getPublicUrl(filePath);

      // 3. Update Profile
      const updated = await updateProfile(profile.id, {
        username: profile.username ?? '',
        bio: profile.bio ?? undefined,
        website: profile.website ?? undefined,
        avatar_url: publicUrl,
      });
      setProfile(updated);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao atualizar foto de perfil');
    } finally {
      setIsUploading(false);
      setSelectedImageSrc(null);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Reset input
    event.target.value = '';

    // If GIF, upload directly to preserve animation
    if (file.type === 'image/gif') {
      await uploadAvatar(file);
      return;
    }

    // For other images, open cropper
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setSelectedImageSrc(reader.result?.toString() || null);
      setCropModalOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Avatar Section Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-[120px] w-[120px] rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <Separator />

        {/* Profile Fields Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" /> {/* Heading */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" /> {/* Label */}
            <Skeleton className="h-10 w-full" /> {/* Input */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" /> {/* Label */}
            <Skeleton className="h-20 w-full" /> {/* Textarea */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" /> {/* Label */}
            <Skeleton className="h-10 w-full" /> {/* Input */}
          </div>
          <Skeleton className="h-10 w-full mt-2" /> {/* Button */}
        </div>

        <Separator />

        {/* App Settings Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-[72px] w-full rounded-xl" />
        </div>

        <Separator />

        {/* Account Actions Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Avatar Section */}
        <section className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-[120px] w-[120px] ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl">
                {profile?.username?.charAt(0).toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className={`absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity ${
                isUploading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-90'
              }`}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={handleFileChange}
              />
            </label>
          </div>
          <div>
            <p className="font-medium">@{profile?.username ?? 'usuário'}</p>
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
                <FormDescription>Máximo de 160 caracteres</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Website</FormLabel>
                  {field.value && (
                    <a
                      href={
                        field.value.startsWith('http')
                          ? field.value
                          : `https://${field.value}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Ver site
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
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
              'Salvar alterações'
            )}
          </Button>
        </section>

        <Separator />

        {/* Account Actions */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Conta</h2>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
          <DeleteAccountDialog />
        </section>
      </form>

      <ImageCropper
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        imageSrc={selectedImageSrc}
        onComplete={(croppedBlob) => uploadAvatar(croppedBlob)}
      />
    </Form>
  );
}
