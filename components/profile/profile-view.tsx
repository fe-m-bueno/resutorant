'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings, Edit2, Globe, Lock, List as ListIcon, Bookmark } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
import { FilterBar, FilterBarSkeleton, type FilterState } from '@/components/profile/filter-bar';
import type { ReviewWithVenue, Profile, List, VenueWithCuisines } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { ListCard, ListCardSkeleton } from '@/components/list-card';
import { VenueCard, VenueCardSkeleton } from '@/components/venue-card';

// Custom type for lists with count
type ListWithCount = List & { venue_count: number; author?: { username: string | null } };

interface ProfileViewProps {
  profile: Profile | null | undefined;
  reviews: ReviewWithVenue[];
  lists?: ListWithCount[];
  plannedVenues?: VenueWithCuisines[];
  isLoading: boolean;
  isOwnProfile: boolean;
  onEditLog?: (log: ReviewWithVenue) => void;
  onRefresh?: () => void;
  header?: React.ReactNode;
  currentUserProfile?: Profile | null;
}

export function ProfileView({
  profile,
  reviews,
  lists = [],
  plannedVenues = [],
  isLoading,
  isOwnProfile,
  onEditLog,
  onRefresh,
  header,
  currentUserProfile,
}: ProfileViewProps) {
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

  // Derive available options from all reviews and planned venues (unfiltered)
  const allVenues = [
    ...reviews.map((r) => r.venue),
    ...plannedVenues,
  ];

  const availableCuisines = Array.from(
    new Map(
      allVenues.flatMap((v) => v.cuisines || []).map((c) => [c.name, c]), // Deduplicate by name
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const availableTags = Array.from(
    new Map(
      reviews.flatMap((r) => r.tags || []).map((t) => [t.name, t]), // Deduplicate by name
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const availableCities = Array.from(
    new Set(
      allVenues
        .map((v) => (v.location as any)?.city)
        .filter(Boolean) as string[],
    ),
  ).sort();

  const availableTypes = Array.from(
    new Set(allVenues.map((v) => v.type)),
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

  const filteredLists = lists.filter((list) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = list.name.toLowerCase();
      const desc = list.description?.toLowerCase() || '';
      return name.includes(query) || desc.includes(query);
    }
    return true;
  });

  const filteredPlannedVenues = plannedVenues.filter((venue) => {
    // Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const venueName = venue.name.toLowerCase();
      const cuisines =
        venue.cuisines?.map((c) => c.name.toLowerCase()).join(' ') || '';
      const location = (venue.location as any)?.city?.toLowerCase() || '';

      const matchesSearch =
        venueName.includes(query) ||
        cuisines.includes(query) ||
        location.includes(query);

      if (!matchesSearch) return false;
    }

    // Specific Filters
    if (filters.city && (venue.location as any)?.city !== filters.city) {
      return false;
    }

    if (
      filters.types.length > 0 &&
      !filters.types.includes(venue.type)
    ) {
      return false;
    }

    if (filters.cuisines.length > 0) {
      const venueCuisines = venue.cuisines?.map((c) => c.name) || [];
      const hasCuisine = filters.cuisines.some((c) =>
        venueCuisines.includes(c),
      );
      if (!hasCuisine) return false;
    }

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

  const sortedPlannedVenues = [...filteredPlannedVenues].sort((a, b) => {
    switch (sortOption) {
      case "date-desc":
        // For planned venues, we might don't have a visited_at, so use created_at if available
        // But user_venue_plans has created_at, however Venue type might not have it directly if it's the venue object
        // Actually Venue has created_at
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "date-asc":
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "alpha-asc":
        return a.name.localeCompare(b.name);
      // Rating doesn't apply to planned venues yet
      default:
        return 0;
    }
  });

  // Calculate rating distribution for histogram
  const ratingDistribution = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(
    (rating) => ({
      rating,
      count: reviews.filter((r) => r.rating === rating).length,
    }),
  );

  const publicReviews = sortedReviews.filter((r) => !r.is_private);
  const privateReviews = sortedReviews.filter((r) => r.is_private);

  // For public profile view, we default to public reviews only if not specified
  // But since we are showing tabs, 'all' will only show what is passed in `reviews`
  // If `reviews` already only contains public reviews (handled by fetcher), 'all' is fine.

  return (
    <div className="min-h-screen bg-background pb-10 sm:pb-20 lg:ml-64">
      {header && header}

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6">
        {/* Profile Info */}
        <section className="flex items-start gap-3 sm:gap-5">
          <Avatar className="h-24 w-24 sm:h-[120px] sm:w-[120px] ring-2 ring-primary/20 shrink-0">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : (
              <>
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xl">
                  {profile?.username?.charAt(0).toUpperCase() ?? '?'}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[4rem] sm:min-h-[120px]">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-4 w-48 rounded" />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-2xl font-bold truncate leading-none">
                    @{profile?.username ?? 'usuário'}
                  </h2>
                  {isOwnProfile && (
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
                  )}
                </div>

                {profile?.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {profile.bio}
                  </p>
                )}
                
                {profile?.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Globe className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">
                      {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                  </a>
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
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground">
                        {plannedVenues.length}
                      </span>
                      <span className="text-muted-foreground">para ir</span>
                    </div>
                  </div>
              </div>
            )}
          </div>
        </section>

        <div className="mt-4 mb-2 sm:mt-6 sm:mb-8">
          {isLoading ? (
            <FilterBarSkeleton />
          ) : (
            <FilterBar
              onSearchChange={setSearchQuery}
              onFilterChange={setFilters}
              availableCuisines={availableCuisines}
              availableTags={availableTags}
              availableCities={availableCities}
              availableTypes={availableTypes}
            />
          )}
        </div>

        {!isLoading && isOwnProfile && (
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
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent overflow-x-auto scrollbar-hide flex-nowrap border-b border-border/50 rounded-none gap-2 pb-px">
              <TabsTrigger
                value="all"
                className="rounded-full px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-md border border-transparent data-[state=inactive]:hover:bg-accent/50 flex-none h-9"
              >
                Todos ({sortedReviews.length})
              </TabsTrigger>
              {/* Only show Public/Private tabs if it's own profile, otherwise everything is public */}
              {isOwnProfile && (
                <>
                  <TabsTrigger
                    value="public"
                    className="rounded-full px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-md border border-transparent data-[state=inactive]:hover:bg-accent/50 flex-none h-9"
                  >
                    Públicos ({publicReviews.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="private"
                    className="rounded-full px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-md border border-transparent data-[state=inactive]:hover:bg-accent/50 flex-none h-9 gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Privados ({privateReviews.length})
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger
                value="lists"
                className="rounded-full px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-md border border-transparent data-[state=inactive]:hover:bg-accent/50 flex-none h-9 gap-1.5"
              >
                <ListIcon className="h-3.5 w-3.5" />
                Listas ({filteredLists.length})
              </TabsTrigger>
              <TabsTrigger
                value="planned"
                className="rounded-full px-4 py-2 text-xs font-semibold transition-all data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-md border border-transparent data-[state=inactive]:hover:bg-accent/50 flex-none h-9 gap-1.5"
              >
                <Bookmark className="h-3.5 w-3.5" />
                Planejo Ir ({filteredPlannedVenues.length})
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
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onEdit={isOwnProfile && onEditLog ? onEditLog : undefined}
                      currentUserId={currentUserProfile?.id}
                      currentUserProfile={currentUserProfile}
                      onRefresh={onRefresh}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground w-full">
                  <p>Nenhum log encontrado</p>
                  {isOwnProfile && (
                    <Button
                      variant="link"
                      onClick={() => {
                        if (onEditLog) onEditLog({} as any); // Trigger add mode
                      }}
                      className="mt-2"
                    >
                      Registrar primeiro log
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {isOwnProfile && (
              <>
                <TabsContent value="public" className="mt-4">
                  {publicReviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {publicReviews.map((review) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          onEdit={onEditLog}
                          currentUserId={currentUserProfile?.id}
                          currentUserProfile={currentUserProfile}
                          onRefresh={onRefresh}
                        />
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
                        <ReviewCard
                          key={review.id}
                          review={review}
                          onEdit={onEditLog}
                          currentUserId={currentUserProfile?.id}
                          currentUserProfile={currentUserProfile}
                          onRefresh={onRefresh}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground w-full">
                      Nenhum log privado
                    </p>
                  )}
                </TabsContent>
              </>
            )}

            <TabsContent value="lists" className="mt-4">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ListCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredLists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredLists.map((list) => (
                    <ListCard
                      key={list.id}
                      list={list}
                      venueCount={list.venue_count}
                      author={list.author ?? undefined}
                      currentUserProfile={currentUserProfile}
                      onRefresh={onRefresh}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground w-full">
                  Nenhuma lista encontrada
                </p>
              )}
            </TabsContent>

            <TabsContent value="planned" className="mt-4">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <VenueCardSkeleton key={i} />
                  ))}
                </div>
              ) : sortedPlannedVenues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedPlannedVenues.map((venue) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      currentUserProfile={currentUserProfile}
                      onRefresh={onRefresh}
                      isPlanned={true}
                      showQuickActions={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground w-full">
                  Nenhum plano para visitar lugares
                </p>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
