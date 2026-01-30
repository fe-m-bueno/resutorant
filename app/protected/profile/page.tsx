"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Settings, Edit2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReviewCard, ReviewCardSkeleton } from "@/components/review-card"
import { RatingHistogram, RatingHistogramSkeleton } from "@/components/rating-histogram"
import { BottomNav } from "@/components/bottom-nav"
import { AddLogModal } from "@/components/add-log-modal"
import { getProfile, getReviewsByUser } from "@/lib/queries"
import { createClient } from "@/lib/supabase/client"
import type { Profile, ReviewWithVenue } from "@/lib/types"

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviews, setReviews] = useState<ReviewWithVenue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    setIsLoading(true)
    try {
      const [profileData, reviewsData] = await Promise.all([
        getProfile(user.id),
        getReviewsByUser(user.id),
      ])
      setProfile(profileData)
      setReviews(reviewsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculate rating distribution for histogram
  const ratingDistribution = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
  }))

  const publicReviews = reviews.filter((r) => !r.is_private)
  const privateReviews = reviews.filter((r) => r.is_private)

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Perfil</h1>
          <Link href="/protected/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Profile Info */}
        <section className="flex items-start gap-4">
          <Avatar className="h-20 w-20 ring-2 ring-primary/20">
            {isLoading ? (
              <AvatarFallback className="animate-pulse" />
            ) : (
              <>
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xl">
                  {profile?.username?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold truncate">
                  @{profile?.username ?? "usuário"}
                </h2>
                {profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile.bio}
                  </p>
                )}
                <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar perfil
                </Button>
              </>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-2xl font-bold">{reviews.length}</p>
            <p className="text-xs text-muted-foreground">Logs</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-2xl font-bold">
              {new Set(reviews.map((r) => r.venue_id)).size}
            </p>
            <p className="text-xs text-muted-foreground">Lugares</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Listas</p>
          </div>
        </section>

        {/* Rating Histogram */}
        <section className="mt-6 rounded-xl border p-4">
          <h3 className="text-sm font-medium mb-4">Distribuição de Notas</h3>
          {isLoading ? (
            <RatingHistogramSkeleton />
          ) : (
            <RatingHistogram data={ratingDistribution} />
          )}
        </section>

        {/* Reviews Tabs */}
        <section className="mt-6">
          <Tabs defaultValue="all">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">
                Todos ({reviews.length})
              </TabsTrigger>
              <TabsTrigger value="public" className="flex-1">
                Públicos ({publicReviews.length})
              </TabsTrigger>
              <TabsTrigger value="private" className="flex-1">
                Privados ({privateReviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <ReviewCardSkeleton key={i} />
                ))
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
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

            <TabsContent value="public" className="mt-4 space-y-3">
              {publicReviews.length > 0 ? (
                publicReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum log público
                </p>
              )}
            </TabsContent>

            <TabsContent value="private" className="mt-4 space-y-3">
              {privateReviews.length > 0 ? (
                privateReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">
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
        onSuccess={loadData}
      />
    </div>
  )
}
