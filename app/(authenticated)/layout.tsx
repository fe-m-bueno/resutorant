import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/queries';
import { AuthenticatedLayoutClient } from '@/components/layout/authenticated-layout-client';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const profile = await getProfile(user.id);

  if (!profile?.username) {
    redirect('/onboarding');
  }

  return (
    <AuthenticatedLayoutClient profile={profile}>
      {children}
    </AuthenticatedLayoutClient>
  );
}
