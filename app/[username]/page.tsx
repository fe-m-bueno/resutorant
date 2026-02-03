'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileView } from '@/components/profile/profile-view';
import { usePublicProfile, useUser, useProfile } from '@/hooks/use-profile-data';
import { notFound } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { AddLogModal } from '@/components/add-log-modal';
import { useQueryClient } from '@tanstack/react-query';

interface UserProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function UserProfilePage(props: UserProfilePageProps) {
  const params = use(props.params);
  // Decode the username to handle %40 correctly
  const decodedUsername = decodeURIComponent(params.username);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['lists'] });
    queryClient.invalidateQueries({ queryKey: ['planned_venues'] });
  };

  // Check if it starts with @ or %40 (which is @ encoded)
  // If we are here, it means it matched [username], so we should check if it is intended as a profile route
  const isProfileRoute = decodedUsername.startsWith('@');

  const { profile, reviews, lists, plannedVenues, isLoading, notFound: profileNotFound } = usePublicProfile(
    isProfileRoute ? decodedUsername : ''
  );

  useEffect(() => {
    // If it doesn't look like a profile route (no @), or if profile is not found after loading
    if (!isProfileRoute) {
      // In a real app we might let this fall through to other catch-all routes or 404
      // For now, if it's not starting with @, we can 404 or redirect.
      // But since this is a top level catch-all, we should be careful.
      // Assuming this is the only dynamic route at root for now.
    }
  }, [isProfileRoute]);

  if (!isProfileRoute) {
     notFound();
     return null;
  }

  if (profileNotFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Usuário não encontrado</h1>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  const header = (
    <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">
          {profile ? `@${profile.username}` : 'Carregando...'}
        </h1>
      </div>
    </header>
  );

  // Get current user to check if it's their own profile
  const { data: currentUser } = useUser();
  const { data: currentUserProfile } = useProfile(currentUser?.id);
  const isOwnProfile = currentUser?.id === profile?.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleAddClick = () => {
    // If not logged in, maybe redirect or show auth modal?
    // For now, we open the modal which might handle its own auth state or fail gracefully
    setIsModalOpen(true); 
  };

  return (
    <>
      <ProfileView
        profile={profile}
        reviews={reviews}
        lists={lists}
        plannedVenues={plannedVenues}
        isLoading={isLoading}
        isOwnProfile={isOwnProfile}
        onRefresh={handleRefresh}
        header={header}
        currentUserProfile={currentUserProfile}
      />
      <BottomNav onAddClick={handleAddClick} />
      <AddLogModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
           // We might want to refetch reviews if we added one on our own profile
        }}
      />
    </>
  );
}
