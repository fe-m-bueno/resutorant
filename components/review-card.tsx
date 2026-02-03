'use client';

import React, { memo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MapPin,
  Lock,
  Heart,
  MessageCircle,
  Edit2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  differenceInMinutes,
  differenceInHours,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RatingDisplay } from '@/components/rating-input';
import { CommentSection } from '@/components/comments/comment-section';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReviewWithVenue, Profile } from '@/lib/types';

interface ReviewCardProps {
  review: ReviewWithVenue;
  profile?: Profile;
  showProfile?: boolean;
  likesCount?: number;
  isLiked?: boolean;
  onLike?: () => void;
  currentUserProfile?: Profile;
}

const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMin = differenceInMinutes(now, date);
  const diffHours = differenceInHours(now, date);

  if (diffMin < 60) {
    return `há ${diffMin} minutos`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else {
    return format(date, 'dd/MM/yyyy');
  }
};

export const ReviewCard = memo(function ReviewCard({
  review,
  profile,
  showProfile = false,
  likesCount = 0,
  isLiked = false,
  onLike,
  onEdit,
  currentUserId,
  currentUserProfile,
}: ReviewCardProps & {
  onEdit?: (review: ReviewWithVenue) => void;
  currentUserId?: string;
}) {
  const [showComments, setShowComments] = React.useState(false);

  const location = review.venue.location as {
    city?: string;
    neighborhood?: string;
  };
  const locationText = [location?.neighborhood, location?.city]
    .filter(Boolean)
    .join(', ');

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

  const isOwner = currentUserId === review.user_id;

  const author = profile || review.author;

  return (
    <div className="flex flex-col gap-2">
      {/* External Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {author && (
            <>
              <Avatar className="h-6 w-6">
                <AvatarImage src={author.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px] bg-secondary">
                  {author.username?.charAt(0).toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground/90">
                @{author.username}
              </span>
            </>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {formatRelativeDate(review.created_at)}
        </span>
      </div>

      <Card className="overflow-hidden border-border/50 hover:shadow-md hover:border-border transition-colors">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate flex flex-row gap-4">
              {review.venue.name}
              {review.is_private && (
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-muted-foreground">
              <Badge
                variant="secondary"
                className="text-xs font-bold px-1.5 h-5 flex gap-px"
              >
                {[...Array(review.price_level ?? 3)].map((_, i) => (
                  <span key={i}>$</span>
                ))}
              </Badge>
              <Badge variant="secondary" className="text-xs font-normal">
                {venueTypeLabels[review.venue.type] ?? review.venue.type}
              </Badge>
              {locationText && (
                <span className="flex items-center gap-1 truncate text-xs">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {locationText}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <RatingDisplay value={review.rating} size="sm" />
          </div>
        </div>

        {/* Review text */}
        {review.text_review && (
          <p className="mt-3 text-sm text-foreground/80 line-clamp-2 leading-relaxed">
            {review.text_review}
          </p>
        )}

        {/* Tags */}
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {review.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs font-normal border-0"
                style={{
                  backgroundColor: `${tag.color ?? '#6366f1'}12`,
                  color: tag.color ?? '#6366f1',
                }}
              >
                {tag.name}
              </Badge>
            ))}
            {review.tags.length > 4 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{review.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {review.visited_at
              ? format(
                  new Date(review.visited_at + 'T00:00:00'),
                  'd MMM yyyy',
                  { locale: ptBR },
                )
              : 'Data não informada'}
          </span>
          <div className="flex items-center gap-2">
            {isOwner && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(review)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-muted-foreground hover:bg-secondary transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Show social features only if privacy settings allow */}
            {!review.author?.disable_own_social &&
              !currentUserProfile?.disable_view_others_social && (
                <>
                  <button
                    type="button"
                    onClick={onLike}
                    className={cn(
                      'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors',
                      isLiked ||
                        (review.likes?.some(
                          (l) => l.user_id === currentUserId,
                        ) ??
                          false)
                        ? 'text-red-500 bg-red-500/10'
                        : 'text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    <Heart
                      className={cn(
                        'h-3.5 w-3.5',
                        (isLiked ||
                          (review.likes?.some(
                            (l) => l.user_id === currentUserId,
                          ) ??
                            false)) &&
                          'fill-current',
                      )}
                    />
                    {(likesCount > 0 || (review.likes?.length ?? 0) > 0) && (
                      <span>{likesCount || review.likes?.length}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowComments(!showComments)}
                    className={cn(
                      'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors',
                      showComments
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {(review._count?.comments || 0) > 0 && (
                      <span>{review._count?.comments}</span>
                    )}
                    <div className="w-3 h-3 flex items-center justify-center">
                      {showComments ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </button>
                </>
              )}
          </div>
        </div>

        {/* Likes Detail Section */}
        {review.likes &&
          review.likes.length > 0 &&
          !review.author?.disable_own_social &&
          !currentUserProfile?.disable_view_others_social && (
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
              <Heart className="h-3.5 w-3.5 text-red-500 fill-current" />
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {review.likes.length}
                </span>{' '}
                {review.likes.length === 1 ? 'curtida' : 'curtidas'} de{' '}
                <span className="font-medium text-foreground">
                  {review.likes[0].user?.username}
                </span>
                {review.likes.length > 1 && (
                  <span> e {review.likes.length - 1} outros</span>
                )}
              </div>
            </div>
          )}

        {/* Comments Section using Accordion style */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Comentários</h4>
              <button
                onClick={() => setShowComments(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Fechar
              </button>
            </div>
            <CommentSection
              logId={review.id}
              currentUserId={currentUserId}
              logOwnerId={review.user_id}
            />
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
});

// Skeleton version for loading states
export function ReviewCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <Skeleton className="h-7 w-12 rounded-lg" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="flex gap-1.5 mt-4">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
            <Skeleton className="h-3 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-10 rounded-md" />
              <Skeleton className="h-6 w-10 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
