import { notFound } from 'next/navigation';
import {
  getVenueBySlug,
  getVenueStats,
  getVenueReviews,
  getUserPlanStatus,
} from '@/lib/queries/venue-details';
import { getProfile } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ReviewCard } from '@/components/review-card';
import { AddLogButton } from './add-log-button'; // Client component for interaction
import { PlanButton } from './plan-button';
import { PageTitle } from '@/components/layout/page-title';
import { MapPin, ChefHat, Star } from 'lucide-react';

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

export default async function VenuePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);

  if (!venue) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id;
  const currentUser = user ? await getProfile(user.id) : null;

  const [stats, reviews] = await Promise.all([
    getVenueStats(venue.id, viewerId),
    getVenueReviews(venue.id, viewerId),
  ]);

  const isPlanned = user ? await getUserPlanStatus(venue.id, user.id) : false;

  const location = venue.location as {
    city?: string;
    neighborhood?: string;
    address?: string;
  };
  const locationText = [
    location?.address,
    location?.neighborhood,
    location?.city,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="bg-background">
      <PageTitle title={venue.name} />

      <main className="mx-auto max-w-5xl px-4 lg:px-8 py-6 lg:py-8 space-y-8">
        {/* Venue Info */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
              <ChefHat className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{venue.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
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
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{locationText || 'Endereço não informado'}</span>
          </div>

          {venue.cuisines && venue.cuisines.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {venue.cuisines.map((c) => (
                <Badge
                  key={c.id}
                  variant="secondary"
                  className="text-xs flex items-center gap-1.5"
                >
                  {c.icon && <span>{c.icon}</span>}
                  <span>{c.name}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Stats */}
          <div className="md:col-span-1 space-y-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="space-y-1">
                <div className="flex text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const rating = stats.averageRating;
                    const filled = i < Math.floor(rating);
                    const half = i === Math.floor(rating) && rating % 1 >= 0.5;

                    return (
                      <div key={i} className="relative">
                        <Star
                          className={`h-5 w-5 ${
                            filled
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-muted/30'
                          }`}
                        />
                        {half && (
                          <div className="absolute inset-0 overflow-hidden w-[50%]">
                            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.totalReviews} avaliações
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {stats.histogram
                .sort((a, b) => b.rating - a.rating)
                .map((item) => {
                  const percentage =
                    stats.totalReviews > 0
                      ? (item.count / stats.totalReviews) * 100
                      : 0;
                  return (
                    <div
                      key={item.rating}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="w-8 text-right font-medium">
                        {item.rating}
                      </span>
                      <Progress value={percentage} className="h-2" />
                      <span className="w-8 text-muted-foreground tabular-nums">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="p-4 bg-secondary/30 rounded-xl border border-border/50 text-center">
              <div className="text-2xl font-bold">{stats.plannedCount}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Pessoas planejam ir
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Avaliações</h2>
              <div className="flex items-center gap-2">
                <PlanButton
                  venueId={venue.id}
                  initialIsPlanned={isPlanned}
                  userId={user?.id}
                />
                <AddLogButton venue={venue} />
              </div>
            </div>

            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  currentUserProfile={currentUser}
                  currentUserId={user?.id}
                  showProfile={true}
                />
              ))}
              {reviews.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                  <p>Nenhuma avaliação ainda.</p>
                  <p className="text-sm">
                    Seja o primeiro a avaliar este local!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
