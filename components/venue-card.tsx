'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  ChefHat,
  Edit2,
  Trash2,
  Plus,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EditVenueModal } from '@/components/edit-venue-modal';
import { deleteVenue } from '@/lib/queries';
import { togglePlanToGo } from '@/lib/actions/plans';
import { toast } from 'sonner';
import type { Venue, Profile, VenueWithCuisines } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const AddLogModal = dynamic(
  () =>
    import('@/components/add-log-modal').then((m) => ({
      default: m.AddLogModal,
    })),
  { ssr: false },
);

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
  onRefresh,
  isPlanned: initialIsPlanned = false,
  showQuickActions = false,
}: {
  venue: VenueWithCuisines;
  currentUserProfile?: Profile | null;
  onRefresh?: () => void;
  isPlanned?: boolean;
  showQuickActions?: boolean;
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPlanned, setIsPlanned] = useState(initialIsPlanned);

  useEffect(() => {
    setIsPlanned(initialIsPlanned);
  }, [initialIsPlanned]);

  const location = venue.location as { city?: string; neighborhood?: string };
  const locationText = [location?.neighborhood, location?.city]
    .filter(Boolean)
    .join(', ');

  const isAdmin = currentUserProfile?.is_admin;
  const isCreator = currentUserProfile?.id === venue.created_by;
  const canEdit = isAdmin || isCreator;
  const canDelete = isAdmin;

  const handleDelete = async () => {
    if (
      !confirm(
        'Tem certeza que deseja excluir este local? Todos os reviews associados também serão excluídos.',
      )
    ) {
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

  const handlePlanToggle = async () => {
    if (!currentUserProfile) {
      toast.error('Você precisa estar logado.');
      return;
    }

    const newState = !isPlanned;
    setIsPlanned(newState); // Optimistic

    try {
      await togglePlanToGo(venue.id);
      toast.success(
        newState ? 'Adicionado aos planos!' : 'Removido dos planos.',
      );
    } catch (error) {
      setIsPlanned(!newState); // Revert
      console.error(error);
      toast.error('Erro ao atualizar planos.');
    }
  };

  return (
    <>
      <Card className="group overflow-hidden border-border/50 transition-all hover:shadow-xl hover:border-primary/20 relative bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 md:p-8 flex flex-col h-full">
          <div className="flex items-start gap-5 flex-1">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0 transition-transform group-hover:scale-105 group-hover:bg-primary/20">
              <ChefHat className="h-8 w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold text-xl md:text-2xl leading-tight text-foreground transition-colors flex-1 min-w-0">
                  <Link
                    href={`/venue/${venue.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {venue.name}
                  </Link>
                </h3>

                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full hover:bg-muted"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold bg-primary/5 border-primary/10 text-primary uppercase tracking-wider"
                  >
                    {venueTypeLabels[venue.type] ?? venue.type}
                  </Badge>
                  {(venue.avg_price ?? 0) > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-bold px-1.5 h-auto flex gap-px bg-primary/5 text-primary border-primary/10"
                    >
                      {Array.from({ length: venue.avg_price ?? 0 }).map(
                        (_, i) => (
                          <span key={i}>$</span>
                        ),
                      )}
                    </Badge>
                  )}
                </div>
                {venue.cuisines && venue.cuisines.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {venue.cuisines.map((c) => (
                      <Badge
                        key={c.id}
                        variant="secondary"
                        className="text-[10px] md:text-xs font-medium bg-muted/50 text-muted-foreground whitespace-nowrap flex items-center gap-1.5 px-2.5 py-0.5"
                      >
                        {c.icon && <span>{c.icon}</span>}
                        <span>{c.name}</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {locationText && (
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground/80">
                  <MapPin className="h-4 w-4 text-primary/60 shrink-0" />
                  <span className="truncate">{locationText}</span>
                </div>
              )}
            </div>
          </div>

          {showQuickActions && (
            <>
              <Separator className="my-6 opacity-30" />
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'flex-1 h-11 text-sm font-semibold gap-2 rounded-xl border transition-all',
                    isPlanned
                      ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                      : 'hover:bg-muted border-border/50',
                  )}
                  onClick={handlePlanToggle}
                >
                  {isPlanned ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  <span>{isPlanned ? 'Planejado' : 'Planejo Ir'}</span>
                </Button>

                <Button
                  variant="secondary"
                  size="icon"
                  className="h-11 w-11 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
                  onClick={() => setIsAddLogOpen(true)}
                  title="Adicionar Log Rápido"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <EditVenueModal
        venue={venue}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={onRefresh}
        currentUserId={currentUserProfile?.id}
      />

      {showQuickActions && (
        <AddLogModal
          open={isAddLogOpen}
          onOpenChange={setIsAddLogOpen}
          initialVenue={venue}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}

export function VenueCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 bg-card/50">
      <CardContent className="p-6 md:p-8 flex flex-col h-full">
        <div className="flex items-start gap-5 flex-1">
          <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
          <div className="flex-1 min-w-0 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-7 md:h-8 w-3/4 rounded" />
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-5 w-12 rounded" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            </div>
            <Skeleton className="h-4 w-1/2 rounded mt-4" />
          </div>
        </div>
        <Separator className="my-6 opacity-30" />
        <div className="flex gap-4">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
