import { createClient } from '@/lib/supabase/client'
import type { 
  Profile, 
  Venue, 
  Review, 
  Tag, 
  CuisineType, 
  List,
  ReviewWithVenue,
  VenueWithCuisines,
  ListWithVenues
} from '@/lib/types'
import type { CreateLogFormData, ProfileFormData } from '@/lib/schemas'

// ============================================================================
// PROFILES
// ============================================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, data: ProfileFormData): Promise<Profile> {
  const supabase = createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return profile
}

// ============================================================================
// VENUES
// ============================================================================

export async function searchVenues(query: string): Promise<Venue[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(10)
  
  if (error) throw error
  return data ?? []
}

export async function createVenue(venue: {
  name: string
  type: Venue['type']
  location: Venue['location']
  created_by: string
}): Promise<Venue> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('venues')
    .insert(venue)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getVenueWithCuisines(venueId: string): Promise<VenueWithCuisines | null> {
  const supabase = createClient()
  
  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .single()
  
  if (venueError) throw venueError
  if (!venue) return null
  
  const { data: cuisineLinks } = await supabase
    .from('venue_cuisines')
    .select('cuisine_id')
    .eq('venue_id', venueId)
  
  if (cuisineLinks?.length) {
    const { data: cuisines } = await supabase
      .from('cuisine_types')
      .select('*')
      .in('id', cuisineLinks.map(l => l.cuisine_id))
    
    return { ...venue, cuisines: cuisines ?? [] }
  }
  
  return venue
}

// ============================================================================
// REVIEWS
// ============================================================================

export async function getReviewsByUser(userId: string): Promise<ReviewWithVenue[]> {
  const supabase = createClient()
  
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*, venue:venues(*)')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false })
  
  if (error) throw error
  if (!reviews?.length) return []
  
  // Fetch all tags in batch (fixes N+1 problem)
  const reviewIds = reviews.map(r => r.id)
  const { data: allTagLinks } = await supabase
    .from('review_tags')
    .select('tag_id, review_id')
    .in('review_id', reviewIds)
  
  if (!allTagLinks?.length) {
    return reviews.map(r => ({ ...r, tags: [] })) as ReviewWithVenue[]
  }
  
  const tagIds = [...new Set(allTagLinks.map(l => l.tag_id))]
  const { data: allTags } = await supabase
    .from('tags')
    .select('*')
    .in('id', tagIds)
  
  // Map tags to reviews
  const tagMap = new Map(allTags?.map(t => [t.id, t]) ?? [])
  const reviewsWithTags = reviews.map(review => ({
    ...review,
    tags: allTagLinks
      .filter(l => l.review_id === review.id)
      .map(l => tagMap.get(l.tag_id))
      .filter(Boolean) ?? []
  }))
  
  return reviewsWithTags as ReviewWithVenue[]
}

export async function getRecentReviews(limit: number): Promise<ReviewWithVenue[]> {
  const supabase = createClient()
  
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*, venue:venues(*)')
    .order('visited_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  if (!reviews?.length) return []
  
  // Fetch all tags in batch (fixes N+1 problem)
  const reviewIds = reviews.map(r => r.id)
  const { data: allTagLinks } = await supabase
    .from('review_tags')
    .select('tag_id, review_id')
    .in('review_id', reviewIds)
  
  if (!allTagLinks?.length) {
    return reviews.map(r => ({ ...r, tags: [] })) as ReviewWithVenue[]
  }
  
  const tagIds = [...new Set(allTagLinks.map(l => l.tag_id))]
  const { data: allTags } = await supabase
    .from('tags')
    .select('*')
    .in('id', tagIds)
  
  // Map tags to reviews
  const tagMap = new Map(allTags?.map(t => [t.id, t]) ?? [])
  const reviewsWithTags = reviews.map(review => ({
    ...review,
    tags: allTagLinks
      .filter(l => l.review_id === review.id)
      .map(l => tagMap.get(l.tag_id))
      .filter(Boolean) ?? []
  }))
  
  return reviewsWithTags as ReviewWithVenue[]
}

export async function createReview(data: {
  user_id: string
  venue_id: string
  rating: number
  text_review?: string
  visited_at?: string
  is_private: boolean
  tag_ids?: string[]
}): Promise<Review> {
  const supabase = createClient()
  
  const { tag_ids, ...reviewData } = data
  
  const { data: review, error } = await supabase
    .from('reviews')
    .insert(reviewData)
    .select()
    .single()
  
  if (error) throw error
  
  // Link tags
  if (tag_ids?.length) {
    await supabase
      .from('review_tags')
      .insert(tag_ids.map(tag_id => ({ review_id: review.id, tag_id })))
  }
  
  return review
}

export async function getUserRatingDistribution(userId: string): Promise<{ rating: number; count: number }[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('user_id', userId)
  
  if (error) throw error
  
  // Group by rating
  const distribution: Record<number, number> = {}
  for (let r = 0.5; r <= 5; r += 0.5) {
    distribution[r] = 0
  }
  
  (data ?? []).forEach(review => {
    distribution[review.rating] = (distribution[review.rating] || 0) + 1
  })
  
  return Object.entries(distribution).map(([rating, count]) => ({
    rating: parseFloat(rating),
    count,
  }))
}

// ============================================================================
// TAGS & CUISINES
// ============================================================================

export async function getTags(userId?: string): Promise<Tag[]> {
  const supabase = createClient()
  
  let query = supabase.from('tags').select('*')
  
  if (userId) {
    query = query.or(`created_by.is.null,created_by.eq.${userId}`)
  } else {
    query = query.is('created_by', null)
  }
  
  const { data, error } = await query.order('name')
  
  if (error) throw error
  return data ?? []
}

export async function getCuisineTypes(userId?: string): Promise<CuisineType[]> {
  const supabase = createClient()
  
  let query = supabase.from('cuisine_types').select('*')
  
  if (userId) {
    query = query.or(`created_by.is.null,created_by.eq.${userId}`)
  } else {
    query = query.is('created_by', null)
  }
  
  const { data, error } = await query.order('name')
  
  if (error) throw error
  return data ?? []
}

export async function createTag(data: { name: string; color: string; created_by: string }): Promise<Tag> {
  const supabase = createClient()
  
  const { data: tag, error } = await supabase
    .from('tags')
    .insert(data)
    .select()
    .single()
  
  if (error) throw error
  return tag
}

// ============================================================================
// LISTS
// ============================================================================

export async function getUserLists(userId: string): Promise<List[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('name')
  
  if (error) throw error
  return data ?? []
}

export async function getListWithVenues(listId: string): Promise<ListWithVenues | null> {
  const supabase = createClient()
  
  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('*')
    .eq('id', listId)
    .single()
  
  if (listError) throw listError
  if (!list) return null
  
  const { data: venueLinks } = await supabase
    .from('list_venues')
    .select('venue_id')
    .eq('list_id', listId)
  
  if (venueLinks?.length) {
    const { data: venues } = await supabase
      .from('venues')
      .select('*')
      .in('id', venueLinks.map(l => l.venue_id))
    
    return { ...list, venues: venues ?? [] }
  }
  
  return list
}

export async function addVenueToList(listId: string, venueId: string, note?: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('list_venues')
    .insert({ list_id: listId, venue_id: venueId, note })
  
  if (error) throw error
}

export async function removeVenueFromList(listId: string, venueId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('list_venues')
    .delete()
    .eq('list_id', listId)
    .eq('venue_id', venueId)
  
  if (error) throw error
}

export async function createList(data: {
  user_id: string
  name: string
  description?: string
  icon?: string
  is_public: boolean
}): Promise<List> {
  const supabase = createClient()
  
  const { data: list, error } = await supabase
    .from('lists')
    .insert(data)
    .select()
    .single()
  
  if (error) throw error
  return list
}

// ============================================================================
// CREATE LOG (Combined Venue + Review)
// ============================================================================

export async function searchReviews(query: string, limit = 20): Promise<ReviewWithVenue[]> {
  const supabase = createClient()
  
  // Search for venues matching the query
  const { data: venues } = await supabase
    .from('venues')
    .select('id')
    .ilike('name', `%${query}%`)
  
  const venueIds = venues?.map(v => v.id) ?? []
  
  // Search reviews by text_review or by matching venue
  let reviewsQuery = supabase
    .from('reviews')
    .select('*, venue:venues(*)')
    .order('visited_at', { ascending: false })
    .limit(limit)
  
  if (venueIds.length > 0) {
    reviewsQuery = reviewsQuery.or(`text_review.ilike.%${query}%,venue_id.in.(${venueIds.join(',')})`)
  } else {
    reviewsQuery = reviewsQuery.ilike('text_review', `%${query}%`)
  }
  
  const { data: reviews, error } = await reviewsQuery
  
  if (error) throw error
  
  // Fetch tags for each review
  const reviewsWithTags = await Promise.all(
    (reviews ?? []).map(async (review) => {
      const { data: tagLinks } = await supabase
        .from('review_tags')
        .select('tag_id')
        .eq('review_id', review.id)
      
      if (tagLinks?.length) {
        const { data: tags } = await supabase
          .from('tags')
          .select('*')
          .in('id', tagLinks.map(l => l.tag_id))
        
        return { ...review, tags: tags ?? [] }
      }
      
      return { ...review, tags: [] }
    })
  )
  
  return reviewsWithTags as ReviewWithVenue[]
}

export async function createLog(
  userId: string,
  data: CreateLogFormData
): Promise<{ venue: Venue; review: Review }> {
  const supabase = createClient()
  
  let venueId = data.venue_id
  let venue: Venue
  
  // Create new venue if needed
  if (!venueId && data.venue_name) {
    const newVenue = await createVenue({
      name: data.venue_name,
      type: data.venue_type ?? 'restaurante',
      location: data.venue_location ?? {},
      created_by: userId,
    })
    venueId = newVenue.id
    venue = newVenue
    
    // Link cuisines
    if (data.cuisine_ids?.length) {
      await supabase
        .from('venue_cuisines')
        .insert(data.cuisine_ids.map(cuisine_id => ({ venue_id: venueId!, cuisine_id })))
    }
  } else {
    const { data: existingVenue, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId!)
      .single()
    
    if (error || !existingVenue) throw error || new Error('Venue not found')
    venue = existingVenue
  }
  
  // Create review
  const review = await createReview({
    user_id: userId,
    venue_id: venueId!,
    rating: data.rating,
    text_review: data.text_review,
    visited_at: data.visited_at,
    is_private: data.is_private,
    tag_ids: data.tag_ids,
  })
  
  return { venue, review }
}
