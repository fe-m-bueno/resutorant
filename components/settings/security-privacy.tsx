'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Lock, Mail, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Profile } from '@/lib/types';

export function SecurityPrivacy() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email ?? '');
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(data);
        }
      } finally {
        setInitialLoading(false);
      }
    }
    loadProfile();
  }, [supabase]);

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[250px] w-full rounded-xl" />
        <Skeleton className="h-[250px] w-full rounded-xl" />
      </div>
    )
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error('Erro ao atualizar senha: ' + error.message);
    } else {
      toast.success('Senha atualizada com sucesso');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      email: email,
    });

    if (error) {
      toast.error('Erro ao atualizar e-mail: ' + error.message);
    } else {
      toast.success(
        'E-mail de confirmação enviado. Verifique seu novo e-mail.',
      );
    }
    setLoading(false);
  };

  const toggleSocialSetting = async (
    field: 'disable_own_social' | 'disable_view_others_social',
    value: boolean,
  ) => {
    if (!profile) return;

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', profile.id);

    if (error) {
      toast.error('Erro ao atualizar configuração: ' + error.message);
    } else {
      setProfile({ ...profile, [field]: value });
      toast.success('Configuração atualizada');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>E-mail</CardTitle>
          </div>
          <CardDescription>
            Altere o endereço de e-mail associado à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Novo E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              Atualizar E-mail
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Senha</CardTitle>
          </div>
          <CardDescription>
            Escolha uma senha forte para manter sua conta segura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Privacidade e Social</CardTitle>
          </div>
          <CardDescription>
            Controle como você interage com outros usuários e como eles veem
            seus posts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label className="text-base">
                Desativar recursos sociais nos meus posts
              </Label>
              <p className="text-sm text-muted-foreground">
                Likes e comentários ficarão desabilitados em todos os seus
                reviews para outros usuários.
              </p>
            </div>
            <Switch
              checked={profile?.disable_own_social ?? false}
              onCheckedChange={(checked) =>
                toggleSocialSetting('disable_own_social', checked)
              }
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label className="text-base">
                Não visualizar recursos sociais
              </Label>
              <p className="text-sm text-muted-foreground">
                Você não verá likes nem comentários em posts de outros usuários.
              </p>
            </div>
            <Switch
              checked={profile?.disable_view_others_social ?? false}
              onCheckedChange={(checked) =>
                toggleSocialSetting('disable_view_others_social', checked)
              }
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
