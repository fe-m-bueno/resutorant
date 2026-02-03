'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ChefHat, Settings, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReviewCard, ReviewCardSkeleton } from '@/components/review-card';
import { BottomNav } from '@/components/bottom-nav';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { getProfile, getRecentReviews, toggleLike } from '@/lib/queries';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile, ReviewWithVenue } from '@/lib/types';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load AddLogModal - only loaded when needed
const AddLogModal = dynamic(
  () =>
    import('@/components/add-log-modal').then((m) => ({
      default: m.AddLogModal,
    })),
  { ssr: false },
);

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<ReviewWithVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ReviewWithVenue | undefined>(
    undefined,
  );
  const [greeting, setGreeting] = useState('Olá');
  const router = useRouter();

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setIsLoading(true);
    try {
      const [profileData, reviewsData] = await Promise.all([
        getProfile(user.id),
        getRecentReviews(20),
      ]);
      setProfile(profileData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }, [router]);

  useEffect(() => {
    loadData();

    // Set greeting on client side to avoid hydration mismatch
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, [loadData]);

  // Memoize computed values to avoid recalculation on every render
  const { userReviews, uniqueVenues, averageRating } = useMemo(() => {
    const filtered = reviews.filter((r) => r.user_id === profile?.id);
    const venues = new Set(filtered.map((r) => r.venue_id)).size;
    const avg =
      filtered.length > 0
        ? (
            filtered.reduce((acc, r) => acc + r.rating, 0) / filtered.length
          ).toFixed(1)
        : '-';
    return { userReviews: filtered, uniqueVenues: venues, averageRating: avg };
  }, [reviews, profile?.id]);

  const handleOpenModal = useCallback(() => {
    setEditingLog(undefined);
    setIsModalOpen(true);
  }, []);

  const handleEditLog = useCallback((log: ReviewWithVenue) => {
    setEditingLog(log);
    setIsModalOpen(true);
  }, []);

  const handleLike = useCallback(
    async (review: ReviewWithVenue) => {
      if (!profile) return;

      const isLiked = review.likes?.some((l) => l.user_id === profile.id);

      // Optimistic update
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id === review.id) {
            const newLikes = isLiked
              ? (r.likes || []).filter((l) => l.user_id !== profile.id)
              : [
                  ...(r.likes || []),
                  { user_id: profile.id, user: { username: profile.username } },
                ];
            return { ...r, likes: newLikes };
          }
          return r;
        }),
      );

      try {
        await toggleLike(profile.id, review.id);
      } catch (error) {
        console.error('Error toggling like:', error);
        // Revert on error
        setReviews((prev) =>
          prev.map((r) => {
            if (r.id === review.id) {
              return review; // Revert to original object
            }
            return r;
          }),
        );
      }
    },
    [profile],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header - only visible on lg+ */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 z-40 h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-8">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-sm bg-secondary">
                  {profile?.username?.charAt(0).toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 glass border-b border-border/30">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ChefHat className="h-4 w-4" />
            </div>
            <span className="font-semibold">Resutorant</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-secondary">
                    {profile?.username?.charAt(0).toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 lg:pt-16 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl px-4 lg:px-8 py-6 lg:py-8">
          {/* Greeting */}
          <section className="mb-8 animate-enter">
            {isLoading ? (
              <Skeleton className="h-9 w-64 rounded-lg" />
            ) : (
              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">
                {greeting}, {profile?.username ?? 'Chef'}! 👋
              </h1>
            )}
            <p className="text-muted-foreground mt-2 text-sm lg:text-base">
              Explore novas experiências gastronômicas
            </p>
          </section>

          {/* Quick stats */}
          <section className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 animate-enter stagger-1">
            <div className="rounded-2xl bg-primary/10 p-5 lg:p-6 border border-primary/10">
              <p className="text-3xl lg:text-4xl font-bold text-primary">
                {userReviews.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Seus logs</p>
            </div>
            <div className="rounded-2xl bg-secondary p-5 lg:p-6 border border-border/50">
              <p className="text-3xl lg:text-4xl font-bold text-foreground">
                {uniqueVenues}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Lugares</p>
            </div>
            <div className="hidden lg:block rounded-2xl bg-secondary p-6 border border-border/50">
              <p className="text-4xl font-bold text-foreground">
                {reviews.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Total no feed
              </p>
            </div>
            <div className="hidden lg:block rounded-2xl bg-secondary p-6 border border-border/50">
              <p className="text-4xl font-bold text-foreground">
                {averageRating}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Nota média</p>
            </div>
          </section>

          {/* Recent Feed */}
          <section className="animate-enter stagger-2">
            <h2 className="text-base lg:text-lg font-semibold mb-4">
              Atividade Recente
            </h2>

            <div className="grid gap-3 lg:gap-4 lg:grid-cols-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <ReviewCardSkeleton key={i} />
                ))
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showProfile={review.user_id !== profile?.id}
                    onEdit={handleEditLog}
                    currentUserId={profile?.id}
                    currentUserProfile={profile ?? undefined}
                    onLike={() => handleLike(review)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-16 px-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                    <ChefHat className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">
                    Comece sua jornada
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                    Registre seu primeiro log e construa seu diário gastronômico
                  </p>
                  <Button onClick={handleOpenModal} size="lg">
                    Criar primeiro log
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <BottomNav onAddClick={handleOpenModal} />

      <AddLogModal
        open={isModalOpen}
        onOpenChange={(val) => {
          setIsModalOpen(val);
          if (!val) setEditingLog(undefined);
        }}
        onSuccess={loadData}
        logToEdit={editingLog}
      />
    </div>
  );
}
