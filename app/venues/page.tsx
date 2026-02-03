'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, MapPin } from 'lucide-react';
import { VenueFilters } from '@/components/venue-filters';
import { VenueCard, VenueCardSkeleton } from '@/components/venue-card';
import { BottomNav } from '@/components/bottom-nav';
import { AddVenueModal } from '@/components/add-venue-modal';
import { AddLogModal } from '@/components/add-log-modal';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  searchVenuesWithFilters, 
  getCuisineTypes, 
  getProfile 
} from '@/lib/queries';
import { getPlannedVenues } from '@/lib/actions/plans'; // Server action
import { createClient } from '@/lib/supabase/client';
import type { Venue, CuisineType, Profile, ReviewWithVenue, VenueWithCuisines } from '@/lib/types';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function VenuesPage() {
  const [venues, setVenues] = useState<VenueWithCuisines[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCuisines, setAvailableCuisines] = useState<CuisineType[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [plannedVenueIds, setPlannedVenueIds] = useState<string[]>([]);
  
  // Modals
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState<string[]>([]);

  const fetchVenues = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await searchVenuesWithFilters(
        searchQuery,
        typeFilter,
        locationFilter,
        cuisineFilter
      );
      setVenues(results);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, typeFilter, locationFilter, cuisineFilter]);

  const loadUserData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const [profile, cuisines, planned] = await Promise.all([
        getProfile(user.id),
        getCuisineTypes(user.id),
        getPlannedVenues(user.id)
      ]);
      setCurrentUser(profile);
      setAvailableCuisines(cuisines);
      setPlannedVenueIds(planned);
    } else {
       // Load public cuisines if not logged in
       const cuisines = await getCuisineTypes();
       setAvailableCuisines(cuisines);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 glass border-b border-border/30">
        <div className="mx-auto flex h-14 items-center justify-between px-4">
          <span className="font-semibold">Lugares e Restaurantes</span>
          <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => setIsAddVenueOpen(true)}
             className="text-primary"
          >
             <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 z-40 h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-8">
        <h1 className="text-lg font-semibold">Lugares</h1>
        <Button onClick={() => setIsAddVenueOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Local
        </Button>
      </header>

      <main className="lg:ml-64 lg:pt-16 p-4 lg:p-8 flex flex-col items-center">
        <div className="w-full max-w-5xl">
        <div className="mb-6 space-y-4">
          <div className="lg:hidden flex items-center justify-between mb-4">
             <h1 className="text-2xl font-bold">Explorar Lugares</h1>
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
          
          {/* Add New Venue Card (Visible in grid) */}
          <button
             onClick={() => setIsAddVenueOpen(true)}
             className="flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-primary/20 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary group min-h-[200px]"
          >
             <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Plus className="h-8 w-8" />
             </div>
             <span className="font-semibold text-base md:text-lg">Adicionar Novo Local</span>
             <p className="text-sm text-muted-foreground/60 mt-1">Clique para cadastrar um novo restaurante</p>
          </button>

          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <VenueCardSkeleton key={i} />
            ))
          ) : venues.length > 0 ? (
            venues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                currentUserProfile={currentUser}
                onRefresh={fetchVenues}
                isPlanned={plannedVenueIds.includes(venue.id)}
                showQuickActions={true}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">
               <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20" />
               <p>Nenhum local encontrado com esses filtros.</p>
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

      <BottomNav onAddClick={() => setIsAddLogOpen(true)} />

      <AddVenueModal
        open={isAddVenueOpen}
        onOpenChange={setIsAddVenueOpen}
        currentUserId={currentUser?.id}
        onSuccess={() => {
           fetchVenues();
           setIsAddVenueOpen(false);
        }}
      />
      
      {/* Global Add Log Modal triggered by FAB/BottomNav */}
      <AddLogModal
        open={isAddLogOpen}
        onOpenChange={setIsAddLogOpen}
        onSuccess={fetchVenues}
      />
    </div>
  );
}
