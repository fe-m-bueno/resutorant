
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, ChefHat, X, Users, List, Store, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReviewCard, ReviewCardSkeleton } from '@/components/review-card';
import { BottomNav } from '@/components/bottom-nav';
import { AddLogModal } from '@/components/add-log-modal';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { searchVenues, searchReviews, getProfile, searchProfiles, searchLists, toggleLike } from '@/lib/queries';
import { createClient } from '@/lib/supabase/client';
import type { Venue, ReviewWithVenue, Profile, List as ListType } from '@/lib/types';

import { VenueCard, VenueCardSkeleton } from '@/components/venue-card';
import { UserCard, UserCardSkeleton } from '@/components/user-card';
import { ListCard, ListCardSkeleton } from '@/components/list-card';

type ListWithMeta = ListType & {
  author: { username: string | null } | null;
  venue_count: number;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [reviews, setReviews] = useState<ReviewWithVenue[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [lists, setLists] = useState<ListWithMeta[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editingLog, setEditingLog] = useState<ReviewWithVenue | undefined>(undefined);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      if (user) {
        const p = await getProfile(user.id);
        setProfile(p);
      }
    }
    loadProfile();
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setVenues([]);
      setReviews([]);
      setUsers([]);
      setLists([]);
      return;
    }

    setIsLoading(true);
    try {
      const [venuesData, reviewsData, usersData, listsData] = await Promise.all([
        searchVenues(searchQuery),
        searchReviews(searchQuery),
        searchProfiles(searchQuery),
        searchLists(searchQuery),
      ]);
      setVenues(venuesData);
      setReviews(reviewsData);
      setUsers(usersData);
      setLists(listsData);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const clearSearch = () => {
    setQuery('');
    setVenues([]);
    setReviews([]);
    setUsers([]);
    setLists([]);
  };

  const hasResults = venues.length > 0 || reviews.length > 0 || users.length > 0 || lists.length > 0;
  const hasQuery = query.trim().length > 0;

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
  
  const handleEditLog = useCallback((review: ReviewWithVenue) => {
    setEditingLog(review);
    setIsModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 z-40 h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-8">
        <div>
          <h1 className="text-lg font-semibold">Buscar</h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
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
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 lg:pt-16 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl px-4 lg:px-8 py-6 lg:py-8">
          {/* Search Input */}
          <section className="mb-6 animate-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar locais, reviews, usuários..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10 h-12 text-base rounded-xl border-border/50 bg-secondary/50 focus:bg-background transition-colors"
                autoFocus
              />
              {hasQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </section>

          {/* Results */}
          {hasQuery ? (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="animate-in stagger-1"
            >
              <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
                <TabsList className="mb-4 inline-flex w-auto min-w-full justify-start sm:w-full">
                  <TabsTrigger value="all" className="flex-1 min-w-[80px]">
                    Tudo
                  </TabsTrigger>
                  <TabsTrigger value="venues" className="flex-1 min-w-[80px] gap-2">
                    <Store className="h-4 w-4 hidden sm:block" />
                    Locais ({venues.length})
                  </TabsTrigger>
                  <TabsTrigger value="users" className="flex-1 min-w-[80px] gap-2">
                    <Users className="h-4 w-4 hidden sm:block" />
                    Usuários ({users.length})
                  </TabsTrigger>
                  <TabsTrigger value="lists" className="flex-1 min-w-[80px] gap-2">
                    <List className="h-4 w-4 hidden sm:block" />
                    Listas ({lists.length})
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1 min-w-[80px] gap-2">
                    <Star className="h-4 w-4 hidden sm:block" />
                    Reviews ({reviews.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="space-y-8">
                {isLoading ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-32" />
                      <div className="grid gap-3 lg:grid-cols-2">
                        <VenueCardSkeleton />
                        <VenueCardSkeleton />
                      </div>
                    </div>
                  </div>
                ) : hasResults ? (
                  <>
                    {/* Venues */}
                    {venues.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Store className="h-4 w-4" /> Locais
                        </h2>
                        <div className="grid gap-3 lg:grid-cols-2">
                          {venues.slice(0, 4).map((venue) => (
                            <VenueCard 
                              key={venue.id} 
                              venue={venue} 
                              currentUserProfile={profile}
                              onRefresh={() => performSearch(query)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users */}
                    {users.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Users className="h-4 w-4" /> Usuários
                        </h2>
                        <div className="grid gap-3 lg:grid-cols-2">
                          {users.slice(0, 4).map((user) => (
                            <UserCard key={user.id} profile={user} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Lists */}
                    {lists.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <List className="h-4 w-4" /> Listas
                        </h2>
                        <div className="grid gap-3 lg:grid-cols-2">
                          {lists.slice(0, 4).map((list) => (
                            <ListCard 
                              key={list.id} 
                              list={list} 
                              venueCount={list.venue_count}
                              author={list.author ?? undefined} 
                              currentUserProfile={profile}
                              onRefresh={() => performSearch(query)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviews */}
                    {reviews.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Star className="h-4 w-4" /> Reviews
                        </h2>
                        <div className="grid gap-3 lg:grid-cols-2">
                          {reviews.slice(0, 4).map((review) => (
                            <ReviewCard
                              key={review.id}
                              review={review}
                              currentUserProfile={profile ?? undefined}
                              currentUserId={profile?.id}
                              onLike={() => handleLike(review)}
                              onEdit={handleEditLog}
                              onRefresh={() => performSearch(query)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptySearchState query={query} />
                )}
              </TabsContent>

              <TabsContent value="venues" className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <VenueCardSkeleton key={i} />
                    ))}
                  </div>
                ) : venues.length > 0 ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {venues.map((venue) => (
                      <VenueCard 
                        key={venue.id} 
                        venue={venue} 
                        currentUserProfile={profile}
                        onRefresh={() => performSearch(query)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptySearchState query={query} type="venues" />
                )}
              </TabsContent>

              <TabsContent value="users" className="space-y-3">
                 {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <UserCardSkeleton key={i} />
                    ))}
                  </div>
                ) : users.length > 0 ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {users.map((user) => (
                      <UserCard key={user.id} profile={user} />
                    ))}
                  </div>
                ) : (
                  <EmptySearchState query={query} type="users" />
                )}
              </TabsContent>
              
              <TabsContent value="lists" className="space-y-3">
                 {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <ListCardSkeleton key={i} />
                    ))}
                  </div>
                ) : lists.length > 0 ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {lists.map((list) => (
                      <ListCard 
                        key={list.id} 
                        list={list}
                        venueCount={list.venue_count}
                        author={list.author ?? undefined} 
                        currentUserProfile={profile}
                        onRefresh={() => performSearch(query)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptySearchState query={query} type="lists" />
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <ReviewCardSkeleton key={i} />
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        currentUserProfile={profile ?? undefined}
                        currentUserId={profile?.id}
                        onLike={() => handleLike(review)}
                        onEdit={handleEditLog}
                        onRefresh={() => performSearch(query)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptySearchState query={query} type="reviews" />
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <InitialSearchState />
          )}
        </div>
      </main>

      <BottomNav onAddClick={() => setIsModalOpen(true)} />

      <AddLogModal 
        open={isModalOpen} 
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingLog(undefined);
        }} 
        logToEdit={editingLog}
        onSuccess={() => performSearch(query)}
      />
    </div>
  );
}

function EmptySearchState({
  query,
  type,
}: {
  query: string;
  type?: 'venues' | 'reviews' | 'users' | 'lists';
}) {
  const typeLabel =
    type === 'venues'
      ? 'locais'
      : type === 'reviews'
        ? 'reviews'
        : type === 'users'
          ? 'usuários'
          : type === 'lists'
            ? 'listas'
            : 'resultados';

  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-xl mb-2">
        Nenhum resultado encontrado
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
        Não encontramos {typeLabel} para &ldquo;{query}&rdquo;. Tente buscar com
        outros termos.
      </p>
    </div>
  );
}

function InitialSearchState() {
  return (
    <div className="text-center py-16 px-4 animate-in stagger-1">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <Search className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-xl mb-2">Explore o Resutorant</h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
        Busque por restaurantes, usuários, listas e reviews para descobrir novas
        experiências gastronômicas.
      </p>
    </div>
  );
}
