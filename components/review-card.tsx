"use client"

import { memo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MapPin, Lock, Heart, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RatingDisplay } from "@/components/rating-input"
import type { ReviewWithVenue, Profile } from "@/lib/types"

interface ReviewCardProps {
  review: ReviewWithVenue
  profile?: Profile
  showProfile?: boolean
  likesCount?: number
  isLiked?: boolean
  onLike?: () => void
}

export const ReviewCard = memo(function ReviewCard({
  review,
  profile,
  showProfile = false,
  likesCount = 0,
  isLiked = false,
  onLike,
}: ReviewCardProps) {
  const location = review.venue.location as { city?: string; neighborhood?: string }
  const locationText = [location?.neighborhood, location?.city]
    .filter(Boolean)
    .join(", ")

  const venueTypeLabels: Record<string, string> = {
    restaurante: "Restaurante",
    café: "Café",
    bar: "Bar",
    lanchonete: "Lanchonete",
    delivery: "Delivery",
    mercado: "Mercado",
    bistrô: "Bistrô",
    izakaya: "Izakaya",
    rotisseria: "Rotisseria",
    padaria: "Padaria",
    pub: "Pub",
  }

  return (
    <Card className="overflow-hidden border-border/50 transition-all hover:shadow-md hover:border-border">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {showProfile && profile && (
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-secondary">
                    {profile.username?.charAt(0).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">
                  {profile.username}
                </span>
              </div>
            )}
            <h3 className="font-semibold text-base leading-tight truncate">
              {review.venue.name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
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
            {review.is_private && (
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            )}
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
              ? format(new Date(review.visited_at), "d MMM yyyy", {
                  locale: ptBR,
                })
              : "Data não informada"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLike}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors",
                isLiked
                  ? "text-red-500 bg-red-500/10"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Heart
                className={cn("h-3.5 w-3.5", isLiked && "fill-current")}
              />
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>
            <button
              type="button"
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-muted-foreground hover:bg-secondary transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

// Skeleton version for loading states
export function ReviewCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="h-7 w-10 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-4 w-full bg-muted rounded-md animate-pulse" />
          <div className="h-4 w-3/4 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="flex gap-2 mt-3">
          <div className="h-5 w-14 bg-muted rounded-full animate-pulse" />
          <div className="h-5 w-18 bg-muted rounded-full animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}
