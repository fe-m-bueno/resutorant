'use client';

import { MapPin, ChefHat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Venue } from '@/lib/types';

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

export function VenueCard({ venue }: { venue: Venue }) {
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
