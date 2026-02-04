'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, MapPin } from 'lucide-react';
import { VenueFilters } from '@/components/venue-filters';
import { VenueCard, VenueCardSkeleton } from '@/components/venue-card';
import { AddVenueModal } from '@/components/add-venue-modal';
import { Button } from '@/components/ui/button';
import {
  searchVenuesWithFilters,
  getCuisineTypes,
  getProfile,
} from '@/lib/queries';
import { getPlannedVenues } from '@/lib/actions/plans'; // Server action
import { createClient } from '@/lib/supabase/client';
import type { CuisineType, Profile, VenueWithCuisines } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/layout/page-title';

export default function PlannedPage() {
  const [venues, setVenues] = useState<VenueWithCuisines[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCuisines, setAvailableCuisines] = useState<CuisineType[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [plannedVenueIds, setPlannedVenueIds] = useState<string[]>([]);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Modals
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState<string[]>([]);

  const fetchVenues = useCallback(async () => {
    // Only fetch if we have the planned IDs loaded (or if we know there are none, though the user must be logged in)
    if (isAuthChecking) return;

    setIsLoading(true);
    try {
      const results = await searchVenuesWithFilters(
        searchQuery,
        typeFilter,
        locationFilter,
        cuisineFilter,
        plannedVenueIds, // Pass the planned IDs to filter
      );
      setVenues(results);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    typeFilter,
    locationFilter,
    cuisineFilter,
    plannedVenueIds,
    isAuthChecking,
  ]);

  const loadUserData = useCallback(async () => {
    setIsAuthChecking(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const [profile, cuisines, planned] = await Promise.all([
        getProfile(user.id),
        getCuisineTypes(user.id),
        getPlannedVenues(user.id),
      ]);
      setCurrentUser(profile);
      setAvailableCuisines(cuisines);
      setPlannedVenueIds(planned);
    } else {
      // Redirect to login or show empty?
      // For now, let's just not load anything personal and let the UI handle empty
      const cuisines = await getCuisineTypes();
      setAvailableCuisines(cuisines);
      // Planned page requires login effectively, or is just empty
    }
    setIsAuthChecking(false);
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // Handler to refresh the specific venue's planned status or remove it from list
  const handleRefresh = async () => {
    // Re-fetch everything to ensure consistency
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const planned = await getPlannedVenues(user.id);
      setPlannedVenueIds(planned); // This will trigger fetchVenues due to dependency
    }
  };

  return (
    <div className="bg-background">
      <PageTitle title="Planejo Ir" />
      <main className="p-4 lg:p-8">
        <div className="mx-auto max-w-5xl w-full">
          <div className="mb-6 space-y-4">
            <div className="lg:hidden flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Planejo Ir</h1>
            </div>

            <VenueFilters
              onSearchChange={setSearchQuery}
              onTypeChange={setTypeFilter}
              onLocationChange={setLocationFilter}
              onCuisineChange={setCuisineFilter}
              availableCuisines={availableCuisines}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {isLoading || isAuthChecking ? (
              Array.from({ length: 6 }).map((_, i) => (
                <VenueCardSkeleton key={i} />
              ))
            ) : venues.length > 0 ? (
              venues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  currentUserProfile={currentUser}
                  onRefresh={handleRefresh}
                  isPlanned={true} // Since we are on planned page, they are initially planned. But if user toggles, this will update on re-render
                  showQuickActions={true}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Nenhum local planejado encontrado.</p>
                {plannedVenueIds.length === 0 && (
                  <p className="mt-2 text-sm text-balance">
                    Marque locais como &ldquo;Planejo ir&rdquo; para vê-los
                    aqui.
                  </p>
                )}
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter(null);
                    setLocationFilter('');
                    setCuisineFilter([]);
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <AddVenueModal
        open={isAddVenueOpen}
        onOpenChange={setIsAddVenueOpen}
        currentUserId={currentUser?.id}
        onSuccess={() => {
          fetchVenues();
          setIsAddVenueOpen(false);
        }}
      />
    </div>
  );
}
