'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, ChefHat, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReviewCard, ReviewCardSkeleton } from '@/components/review-card';
import { BottomNav } from '@/components/bottom-nav';
import { AddLogModal } from '@/components/add-log-modal';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { searchVenues, searchReviews, getProfile } from '@/lib/queries';
import { createClient } from '@/lib/supabase/client';
import type { Venue, ReviewWithVenue, Profile } from '@/lib/types';

const venueTypeLabels: Record<string, string> = {
  restaurante: 'Restaurante',
  café: 'Café',
  bar: 'Bar',
  lanchonete: 'Lanchonete',
  delivery: 'Delivery',
  mercado: 'Mercado',
  bistrô: 'Bistrô',
  izakaya: 'Izakaya',
  rotisseria: 'Rotisseria',
  padaria: 'Padaria',
  pub: 'Pub',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [reviews, setReviews] = useState<ReviewWithVenue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [profile, setProfile] = useState<Profile | null>(null);

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
      return;
    }

    setIsLoading(true);
    try {
      const [venuesData, reviewsData] = await Promise.all([
        searchVenues(searchQuery),
        searchReviews(searchQuery),
      ]);
      setVenues(venuesData);
      setReviews(reviewsData);
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
  };

  const hasResults = venues.length > 0 || reviews.length > 0;
  const hasQuery = query.trim().length > 0;

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
                placeholder="Buscar locais, reviews..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10 h-12 text-base rounded-xl border-border/50 bg-secondary/50 focus:bg-background transition-colors"
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
              <TabsList className="w-full mb-6">
                <TabsTrigger value="all" className="flex-1">
                  Todos ({venues.length + reviews.length})
                </TabsTrigger>
                <TabsTrigger value="venues" className="flex-1">
                  Locais ({venues.length})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1">
                  Reviews ({reviews.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <ReviewCardSkeleton key={i} />
                    ))}
                  </div>
                ) : hasResults ? (
                  <>
                    {/* Venues */}
                    {venues.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-sm font-medium text-muted-foreground">
                          Locais
                        </h2>
                        <div className="grid gap-3 lg:grid-cols-2">
                          {venues.map((venue) => (
                            <VenueCard key={venue.id} venue={venue} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviews */}
                    {reviews.length > 0 && (
                      <div className="space-y-3 mt-6">
                        <h2 className="text-sm font-medium text-muted-foreground">
                          Reviews
                        </h2>
                        <div className="grid gap-3 lg:grid-cols-2">
                          {reviews.map((review) => (
                            <ReviewCard
                              key={review.id}
                              review={review}
                              currentUserProfile={profile ?? undefined}
                              currentUserId={profile?.id}
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
                      <VenueCard key={venue.id} venue={venue} />
                    ))}
                  </div>
                ) : (
                  <EmptySearchState query={query} type="venues" />
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

      <AddLogModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}

function VenueCard({ venue }: { venue: Venue }) {
  const location = venue.location as { city?: string; neighborhood?: string };
  const locationText = [location?.neighborhood, location?.city]
    .filter(Boolean)
    .join(', ');

  return (
    <Card className="overflow-hidden border-border/50 transition-all hover:shadow-md hover:border-border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">
              {venue.name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs font-normal">
                {venueTypeLabels[venue.type] ?? venue.type}
              </Badge>
              {locationText && (
                <span className="flex items-center gap-1 truncate text-xs">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {locationText}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VenueCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 bg-muted rounded-xl animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptySearchState({
  query,
  type,
}: {
  query: string;
  type?: 'venues' | 'reviews';
}) {
  const typeLabel =
    type === 'venues'
      ? 'locais'
      : type === 'reviews'
        ? 'reviews'
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
        Busque por restaurantes, cafés, bares e reviews para descobrir novas
        experiências gastronômicas.
      </p>
    </div>
  );
}
