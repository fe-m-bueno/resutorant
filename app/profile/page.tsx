'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Edit2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReviewCard, ReviewCardSkeleton } from '@/components/review-card';
import {
  RatingHistogram,
  RatingHistogramSkeleton,
} from '@/components/rating-histogram';
import { BottomNav } from '@/components/bottom-nav';
import { AddLogModal } from '@/components/add-log-modal';
import { createClient } from '@/lib/supabase/client';
import { FilterBar, type FilterState } from '@/components/profile/filter-bar';
import type { ReviewWithVenue } from '@/lib/types';
import { useProfileData } from '@/hooks/use-profile-data';
import { useQueryClient } from '@tanstack/react-query';

export default function ProfilePage() {
  const { profile, reviews, isLoading } = useProfileData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  // Filter Logic
  const [searchQuery, setSearchQuery] = useState('');

  const [filters, setFilters] = useState<FilterState>({
    city: null,
    types: [],
    cuisines: [],
    tags: [],
    visibility: 'all',
    ratings: [],
    dateRange: { from: null, to: null },
  });
  const [sortOption, setSortOption] = useState('date-desc');

  // Derive available options from all reviews (unfiltered)
  const availableCuisines = Array.from(
    new Map(
      reviews.flatMap((r) => r.venue.cuisines || []).map((c) => [c.name, c]), // Deduplicate by name
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const availableTags = Array.from(
    new Map(
      reviews.flatMap((r) => r.tags || []).map((t) => [t.name, t]), // Deduplicate by name
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const availableCities = Array.from(
    new Set(
      reviews
        .map((r) => (r.venue.location as any)?.city)
        .filter(Boolean) as string[],
    ),
  ).sort();
  const availableTypes = Array.from(
    new Set(reviews.map((r) => r.venue.type)),
  ).sort();

  const filteredReviews = reviews.filter((review) => {
    // Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const venueName = review.venue.name.toLowerCase();
      const reviewText = review.text_review?.toLowerCase() || '';
      const tags =
        review.tags?.map((t) => t.name.toLowerCase()).join(' ') || '';
      const cuisines =
        review.venue.cuisines?.map((c) => c.name.toLowerCase()).join(' ') || '';
      const location =
        (review.venue.location as any)?.city?.toLowerCase() || '';

      const matchesSearch =
        venueName.includes(query) ||
        reviewText.includes(query) ||
        tags.includes(query) ||
        cuisines.includes(query) ||
        location.includes(query);

      if (!matchesSearch) return false;
    }

    // Specific Filters
    if (filters.city && (review.venue.location as any)?.city !== filters.city) {
      return false;
    }

    if (
      filters.types.length > 0 &&
      !filters.types.includes(review.venue.type)
    ) {
      return false;
    }

    if (filters.cuisines.length > 0) {
      const reviewCuisines = review.venue.cuisines?.map((c) => c.name) || [];
      const hasCuisine = filters.cuisines.some((c) =>
        reviewCuisines.includes(c),
      );
      if (!hasCuisine) return false;
    }

    if (filters.tags.length > 0) {
      const reviewTags = review.tags?.map((t) => t.name) || [];
      const hasTag = filters.tags.some((t) => reviewTags.includes(t));
      if (!hasTag) return false;
    }

    if (filters.dateRange.from) {
      const reviewDate = new Date(review.visited_at || review.created_at);
      const fromDate = new Date(filters.dateRange.from);
      if (reviewDate < fromDate) return false;

      if (filters.dateRange.to) {
        const toDate = new Date(filters.dateRange.to);
        // Add one day to match end of day or use simple comparison
        toDate.setHours(23, 59, 59, 999);
        if (reviewDate > toDate) return false;
      }
    }

    if (filters.visibility === 'public' && review.is_private) return false;
    if (filters.visibility === 'private' && !review.is_private) return false;

    if (filters.ratings.length > 0 && !filters.ratings.includes(review.rating))
      return false;

    return true;
  });

  // Sorting Logic
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortOption) {
      case 'date-desc':
        return (
          new Date(b.visited_at || b.created_at).getTime() -
          new Date(a.visited_at || a.created_at).getTime()
        );
      case 'date-asc':
        return (
          new Date(a.visited_at || a.created_at).getTime() -
          new Date(b.visited_at || b.created_at).getTime()
        );
      case 'alpha-asc':
        return a.venue.name.localeCompare(b.venue.name);
      case 'rating-desc':
        return b.rating - a.rating;
      case 'rating-asc':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  // Calculate rating distribution for histogram
  const ratingDistribution = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5].map(
    (rating) => ({
      rating,
      count: reviews.filter((r) => r.rating === rating).length,
    }),
  );

  const publicReviews = sortedReviews.filter((r) => !r.is_private);
  const privateReviews = sortedReviews.filter((r) => r.is_private);

  return (
    <div className="min-h-screen bg-background pb-10 sm:pb-20">
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

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6">
        {/* Profile Info */}
        <section className="flex items-start gap-3 sm:gap-5">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-2 ring-primary/20 shrink-0">
            {isLoading ? (
              <AvatarFallback className="animate-pulse" />
            ) : (
              <>
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xl">
                  {profile?.username?.charAt(0).toUpperCase() ?? '?'}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[4rem] sm:h-20">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-2xl font-bold truncate leading-none">
                    @{profile?.username ?? 'usuário'}
                  </h2>
                  <Link href="/settings">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 hidden sm:flex"
                    >
                      <Edit2 className="h-3 w-3" />
                      Editar
                    </Button>
                  </Link>
                </div>

                {profile?.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {profile.bio}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">
                      {reviews.length}
                    </span>
                    <span className="text-muted-foreground">logs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">
                      {new Set(reviews.map((r) => r.venue_id)).size}
                    </span>
                    <span className="text-muted-foreground">lugares</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {!isLoading && (
          <div className="mt-4 mb-2 sm:mt-6 sm:mb-8">
            <FilterBar
              onSearchChange={setSearchQuery}
              onFilterChange={setFilters}
              availableCuisines={availableCuisines}
              availableTags={availableTags}
              availableCities={availableCities}
              availableTypes={availableTypes}
            />
          </div>
        )}

        {!isLoading && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 gap-1.5 sm:hidden"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Editar perfil
          </Button>
        )}

        {/* Rating Histogram */}
        <section className="mt-4 sm:mt-6 rounded-xl border p-3 sm:p-4 bg-card/50">
          {isLoading ? (
            <RatingHistogramSkeleton />
          ) : (
            <RatingHistogram
              title="Distribuição de Notas"
              data={ratingDistribution}
              selectedRating={
                filters.ratings.length === 1 ? filters.ratings[0] : null
              }
              onRatingClick={(rating) => {
                // If clicking the same rating that is already exclusively selected, clear it
                if (
                  filters.ratings.length === 1 &&
                  filters.ratings[0] === rating
                ) {
                  setFilters((prev) => ({ ...prev, ratings: [] }));
                } else {
                  // Otherwise set it as the exclusive filter
                  setFilters((prev) => ({ ...prev, ratings: [rating] }));
                }
              }}
            />
          )}
        </section>

        {/* Reviews Tabs */}
        <section className="mt-4 sm:mt-6">
          <Tabs defaultValue="all">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">
                Todos ({sortedReviews.length})
              </TabsTrigger>
              <TabsTrigger value="public" className="flex-1">
                Públicos ({publicReviews.length})
              </TabsTrigger>
              <TabsTrigger value="private" className="flex-1">
                Privados ({privateReviews.length})
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 flex justify-end">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Original" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Mais recentes</SelectItem>
                  <SelectItem value="date-asc">Mais antigos</SelectItem>
                  <SelectItem value="alpha-asc">Ordem alfabética</SelectItem>
                  <SelectItem value="rating-desc">Maior nota</SelectItem>
                  <SelectItem value="rating-asc">Menor nota</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="all" className="mt-4">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ReviewCardSkeleton key={i} />
                  ))}
                </div>
              ) : sortedReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground w-full">
                  <p>Nenhum log ainda</p>
                  <Button
                    variant="link"
                    onClick={() => setIsModalOpen(true)}
                    className="mt-2"
                  >
                    Registrar primeiro log
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="public" className="mt-4">
              {publicReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publicReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground w-full">
                  Nenhum log público
                </p>
              )}
            </TabsContent>

            <TabsContent value="private" className="mt-4">
              {privateReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {privateReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground w-full">
                  Nenhum log privado
                </p>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <BottomNav onAddClick={() => setIsModalOpen(true)} />

      <AddLogModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
