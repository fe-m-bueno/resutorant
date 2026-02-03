import { useState } from 'react';
import { MapPin, ChefHat, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EditVenueModal } from '@/components/edit-venue-modal';
import { deleteVenue } from '@/lib/queries';
import { toast } from 'sonner';
import type { Venue, Profile } from '@/lib/types';

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

export function VenueCard({ 
  venue, 
  currentUserProfile,
  onRefresh
}: { 
  venue: Venue;
  currentUserProfile?: Profile | null;
  onRefresh?: () => void;
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const location = venue.location as { city?: string; neighborhood?: string };
  const locationText = [location?.neighborhood, location?.city]
    .filter(Boolean)
    .join(', ');

  const isAdmin = currentUserProfile?.is_admin;
  const isCreator = currentUserProfile?.id === venue.created_by;
  const canEdit = isAdmin || isCreator;
  const canDelete = isAdmin;

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este local? Todos os reviews associados também serão excluídos.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteVenue(venue.id);
      toast.success('Local excluído com sucesso!');
      onRefresh?.();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir local.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="group overflow-hidden border-border/50 transition-all hover:shadow-md hover:border-border relative">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <ChefHat className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-base leading-tight truncate">
                  {venue.name}
                </h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
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

      <EditVenueModal
        venue={venue}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={onRefresh}
      />
    </>
  );
}

export function VenueCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
