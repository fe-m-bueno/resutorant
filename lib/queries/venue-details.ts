import { createClient } from '@/lib/supabase/server';
import type { VenueWithCuisines, ReviewWithVenue } from '@/lib/types';

export async function getVenueBySlug(slug: string): Promise<VenueWithCuisines | null> {
  const supabase = await createClient();
  const { data: venue, error } = await supabase
    .from('venues')
    .select('*, cuisines:venue_cuisines(cuisine:cuisine_types(*))')
    .eq('slug', slug)
    .single();

  if (error) return null;

  return {
    ...venue,
    cuisines: venue.cuisines?.map((c: any) => c.cuisine).filter(Boolean) || [],
  } as VenueWithCuisines;
}

export async function getVenueStats(venueId: string, viewerId?: string) {
  const supabase = await createClient();
  
  // Get ratings and count - only count public reviews OR reviews by viewer
  let query = supabase.from('reviews').select('rating').eq('venue_id', venueId);
  
  if (viewerId) {
    query = query.or(`is_private.eq.false,user_id.eq.${viewerId}`);
  } else {
    query = query.eq('is_private', false);
  }
  
  const { data: reviews, error } = await query;
    
  if (error) throw error;
  
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews 
    : 0;
    
  // Histogram
  const histogram: Record<number, number> = {};
  for(let i = 0.5; i <= 5; i+=0.5) histogram[i] = 0;
  reviews.forEach(r => {
    histogram[r.rating] = (histogram[r.rating] || 0) + 1;
  });
  
  // Planned count
  const { count: plannedCount, error: planError } = await supabase
    .from('user_venue_plans')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venueId);
    
  if (planError) throw planError;
  
  return {
    totalReviews,
    averageRating,
    histogram: Object.entries(histogram).map(([rating, count]) => ({ rating: parseFloat(rating), count })),
    plannedCount: plannedCount || 0
  };
}

export async function getVenueReviews(
  venueId: string,
  viewerId?: string,
): Promise<ReviewWithVenue[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('reviews')
    .select(
      '*, venue:venues(*, cuisines:venue_cuisines(cuisine:cuisine_types(*))), tags:review_tags(tag:tags(*)), likes(user_id, user:profiles(username)), comments(count), author:profiles(*)'
    )
    .eq('venue_id', venueId);

  // Explicit privacy filter: only public reviews OR reviews by the viewer
  if (viewerId) {
    query = query.or(`is_private.eq.false,user_id.eq.${viewerId}`);
  } else {
    query = query.eq('is_private', false);
  }

  const { data: reviews, error } = await query.order('visited_at', {
    ascending: false,
  });
    
  if (error) throw error;
  
  return (reviews || []).map((review) => {
    const venue = review.venue as any;
    const cuisines = venue?.cuisines?.map((c: any) => c.cuisine).filter(Boolean) || [];
    
    return {
      ...review,
      venue: { ...venue, cuisines },
      tags: review.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      _count: { comments: (review.comments as any)?.[0]?.count || 0 },
      author: review.author,
    };
  }) as ReviewWithVenue[];
}

export async function getUserPlanStatus(venueId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_venue_plans')
    .select('id')
    .eq('venue_id', venueId)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) return false;
  return !!data;
}
