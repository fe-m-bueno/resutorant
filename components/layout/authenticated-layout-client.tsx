'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { BottomNav } from '@/components/bottom-nav';
import { AuthenticatedHeader } from './authenticated-header';
import { AddLogModal } from '@/components/add-log-modal';
import type { Profile } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutProvider, useLayout } from './layout-context';
import { cn } from '@/lib/utils';

interface AuthenticatedLayoutClientProps {
  children: React.ReactNode;
  profile: Profile | null;
}

export function AuthenticatedLayoutClient({
  children,
  profile,
}: AuthenticatedLayoutClientProps) {
  return (
    <LayoutProvider>
      <AuthenticatedLayoutContent profile={profile}>
        {children}
      </AuthenticatedLayoutContent>
    </LayoutProvider>
  );
}

function AuthenticatedLayoutContent({
  children,
  profile,
}: AuthenticatedLayoutClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { title, setTitle } = useLayout();

  // Handle default titles based on path
  useEffect(() => {
    const getInitialTitle = (path: string) => {
      if (path.startsWith('/dashboard')) return 'Dashboard';
      if (path.startsWith('/venues')) return 'Lugares';
      if (path.startsWith('/search')) return 'Buscar';
      if (path.startsWith('/settings')) return 'Configurações';
      if (path.startsWith('/planned')) return 'Planejo Ir';
      if (path.startsWith('/lists')) return 'Listas';
      return 'Resutorant';
    };
    setTitle(getInitialTitle(pathname));
  }, [pathname, setTitle]);

  // Don't show global header on profile page or public profiles
  const isProfilePage =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/@') ||
    (pathname.length > 1 &&
      pathname.startsWith('/') &&
      pathname.includes('%40'));

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onAddClick={() => setIsModalOpen(true)} />
      {!isProfilePage && (
        <AuthenticatedHeader profile={profile} title={title} />
      )}

      <main
        className={cn(
          'lg:ml-64 min-h-[calc(100vh-4rem)]',
          !isProfilePage && 'lg:pt-16',
        )}
      >
        {children}
      </main>

      <BottomNav onAddClick={() => setIsModalOpen(true)} />

      <AddLogModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries();
          router.refresh();
        }}
      />
    </div>
  );
}
