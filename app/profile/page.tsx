'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddLogModal } from '@/components/add-log-modal';
import { BottomNav } from '@/components/bottom-nav';
import { useProfileData } from '@/hooks/use-profile-data';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileView } from '@/components/profile/profile-view';
import type { ReviewWithVenue } from '@/lib/types';

export default function ProfilePage() {
  const { profile, reviews, lists, plannedVenues, isLoading } = useProfileData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ReviewWithVenue | undefined>(
    undefined,
  );
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['lists'] });
    queryClient.invalidateQueries({ queryKey: ['planned_venues'] });
  };

  const handleEditLog = (log: ReviewWithVenue) => {
    // If log is empty (passed from "Register first log" button), treat as new log
    if (Object.keys(log).length === 0) {
      setEditingLog(undefined);
    } else {
      setEditingLog(log);
    }
    setIsModalOpen(true);
  };

  const header = (
    <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <h1 className="text-lg font-semibold">Perfil</h1>
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </header>
  );

  return (
    <>
      <ProfileView
        profile={profile}
        reviews={reviews}
        lists={lists}
        plannedVenues={plannedVenues}
        isLoading={isLoading}
        isOwnProfile={true}
        onEditLog={handleEditLog}
        onRefresh={handleSuccess}
        header={header}
        currentUserProfile={profile}
      />

      <BottomNav
        onAddClick={() => {
          setEditingLog(undefined);
          setIsModalOpen(true);
        }}
      />

      <AddLogModal
        open={isModalOpen}
        onOpenChange={(val) => {
          setIsModalOpen(val);
          if (!val) setEditingLog(undefined);
        }}
        onSuccess={handleSuccess}
        logToEdit={editingLog}
      />
    </>
  );
}
