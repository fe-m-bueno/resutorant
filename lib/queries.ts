import { createClient } from '@/lib/supabase/client';
import type {
  Profile,
  Venue,
  Review,
  Tag,
  CuisineType,
  List,
  ReviewWithVenue,
  VenueWithCuisines,
  ListWithVenues,
} from '@/lib/types';
import type { CreateLogFormData, ProfileFormData } from '@/lib/schemas';

// ============================================================================
// PROFILES
// ============================================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(
  userId: string,
  data: ProfileFormData,
): Promise<Profile> {
  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return profile;
}

// ============================================================================
// VENUES
// ============================================================================

export async function searchVenues(query: string): Promise<Venue[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

export async function createVenue(venue: {
  name: string;
  type: Venue['type'];
  location: Venue['location'];
  created_by: string;
}): Promise<Venue> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('venues')
    .insert(venue)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getVenueWithCuisines(
  venueId: string,
): Promise<VenueWithCuisines | null> {
  const supabase = createClient();

  const { data: venue, error } = await supabase
    .from('venues')
    .select('*, cuisines:venue_cuisines(cuisine:cuisine_types(*))')
    .eq('id', venueId)
    .single();

  if (error) throw error;
  if (!venue) return null;

  // Transform the response to match the expected type
  // Supabase returns nested objects, we need to flatten the structure
  const formattedVenue = {
    ...venue,
    cuisines: venue.cuisines?.map((c: any) => c.cuisine).filter(Boolean) || [],
  };

  return formattedVenue as VenueWithCuisines;
}

// ============================================================================
// REVIEWS
// ============================================================================

export async function getReviewsByUser(
  userId: string,
): Promise<ReviewWithVenue[]> {
  const supabase = createClient();

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(
      '*, venue:venues(*, cuisines:venue_cuisines(cuisine:cuisine_types(*))), tags:review_tags(tag:tags(*)), likes(user_id, user:profiles(username)), comments(count), author:profiles(*)',
    )
    .eq('user_id', userId)
    .order('visited_at', { ascending: false });

  if (error) throw error;
  if (!reviews?.length) return [];

  return reviews.map((review) => {
    const venue = review.venue as any;
    const cuisines =
      venue?.cuisines?.map((c: any) => c.cuisine).filter(Boolean) || [];

    return {
      ...review,
      venue: { ...venue, cuisines },
      tags: review.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      _count: { comments: review.comments?.[0]?.count || 0 }, // Map Supabase response to _count
      author: review.author,
    };
  }) as ReviewWithVenue[];
}

export async function getRecentReviews(
  limit: number,
): Promise<ReviewWithVenue[]> {
  const supabase = createClient();

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(
      '*, venue:venues(*), tags:review_tags(tag:tags(*)), likes(user_id, user:profiles(username)), comments(count), author:profiles(*)',
    )
    .order('visited_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!reviews?.length) return [];

  return reviews.map((review) => ({
    ...review,
    tags: review.tags?.map((t: any) => t.tag).filter(Boolean) || [],
    _count: { comments: (review.comments as any)?.[0]?.count || 0 },
    author: (review as any).author,
  })) as ReviewWithVenue[];
}

export async function createReview(data: {
  user_id: string;
  venue_id: string;
  rating: number;
  text_review?: string;
  visited_at?: string;
  price_level: number;
  is_private: boolean;
  tag_ids?: string[];
}): Promise<Review> {
  const supabase = createClient();

  const { tag_ids, ...reviewData } = data;

  const { data: review, error } = await supabase
    .from('reviews')
    .insert(reviewData)
    .select()
    .single();

  if (error) throw error;

  // Link tags
  if (tag_ids?.length) {
    await supabase
      .from('review_tags')
      .insert(tag_ids.map((tag_id) => ({ review_id: review.id, tag_id })));
  }

  return review;
}

export async function updateLog(
  logId: string,
  userId: string,
  data: CreateLogFormData,
): Promise<void> {
  const supabase = createClient();

  // Validate ownership
  const { data: existingReview, error: fetchError } = await supabase
    .from('reviews')
    .select('user_id')
    .eq('id', logId)
    .single();

  if (fetchError || !existingReview) throw new Error('Review not found');
  if (existingReview.user_id !== userId) throw new Error('Unauthorized');

  // Update review data
  const { error: updateError } = await supabase
    .from('reviews')
    .update({
      rating: data.rating,
      text_review: data.text_review,
      visited_at: data.visited_at,
      price_level: data.price_level,
      is_private: data.is_private,
    })
    .eq('id', logId);

  if (updateError) throw updateError;

  // Update tags
  // First remove all existing tags
  const { error: deleteTagsError } = await supabase
    .from('review_tags')
    .delete()
    .eq('review_id', logId);

  if (deleteTagsError) throw deleteTagsError;

  // Then add new tags
  if (data.tag_ids?.length) {
    const { error: insertTagsError } = await supabase
      .from('review_tags')
      .insert(data.tag_ids.map((tag_id) => ({ review_id: logId, tag_id })));

    if (insertTagsError) throw insertTagsError;
  }
}

export async function deleteLog(logId: string, userId: string): Promise<void> {
  const supabase = createClient();

  // Validate ownership
  const { data: existingReview, error: fetchError } = await supabase
    .from('reviews')
    .select('user_id')
    .eq('id', logId)
    .single();

  if (fetchError || !existingReview) throw new Error('Review not found');
  if (existingReview.user_id !== userId) throw new Error('Unauthorized');

  // Delete related data first (foreign key constraints usually handle this if set to CASCADE,
  // but let's be explicit to be safe or if constraints aren't set up that way)

  // 1. Likes
  await supabase.from('likes').delete().eq('review_id', logId);

  // 2. Review Tags
  await supabase.from('review_tags').delete().eq('review_id', logId);

  // 3. Review Photos
  await supabase.from('review_photos').delete().eq('review_id', logId);

  // 4. Comments
  // Comments might have likes too, so let's delete comments directly.
  await supabase.from('comments').delete().eq('log_id', logId);

  // 5. Delete the review itself
  const { error: deleteError } = await supabase
    .from('reviews')
    .delete()
    .eq('id', logId);

  if (deleteError) throw deleteError;
}

export async function getUserRatingDistribution(
  userId: string,
): Promise<{ rating: number; count: number }[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('user_id', userId);

  if (error) throw error;

  // Group by rating
  const distribution: Record<number, number> = {};
  for (let r = 0.5; r <= 5; r += 0.5) {
    distribution[r] = 0;
  }

  (data ?? []).forEach((review) => {
    distribution[review.rating] = (distribution[review.rating] || 0) + 1;
  });

  return Object.entries(distribution).map(([rating, count]) => ({
    rating: parseFloat(rating),
    count,
  }));
}

// ============================================================================
// TAGS & CUISINES
// ============================================================================

export async function getTags(userId?: string): Promise<Tag[]> {
  const supabase = createClient();

  let query = supabase.from('tags').select('*');

  if (userId) {
    query = query.or(`created_by.is.null,created_by.eq.${userId}`);
  } else {
    query = query.is('created_by', null);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  return data ?? [];
}

export async function getUserCreatedTags(userId: string): Promise<Tag[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('created_by', userId)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function updateTag(
  id: string,
  data: { name: string; color: string },
): Promise<Tag> {
  const supabase = createClient();
  const { data: tag, error } = await supabase
    .from('tags')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return tag;
}

export async function deleteTag(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw error;
}

export async function getCuisineTypes(userId?: string): Promise<CuisineType[]> {
  const supabase = createClient();

  let query = supabase.from('cuisine_types').select('*');

  if (userId) {
    query = query.or(`created_by.is.null,created_by.eq.${userId}`);
  } else {
    query = query.is('created_by', null);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  return data ?? [];
}

export async function getUserCreatedCuisines(
  userId: string,
): Promise<CuisineType[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('cuisine_types')
    .select('*')
    .eq('created_by', userId)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function createCuisine(data: {
  name: string;
  icon?: string;
  created_by: string;
}): Promise<CuisineType> {
  const supabase = createClient();
  const { data: cuisine, error } = await supabase
    .from('cuisine_types')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return cuisine;
}

export async function updateCuisine(
  id: string,
  data: { name: string; icon?: string },
): Promise<CuisineType> {
  const supabase = createClient();
  const { data: cuisine, error } = await supabase
    .from('cuisine_types')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return cuisine;
}

export async function deleteCuisine(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('cuisine_types').delete().eq('id', id);
  if (error) throw error;
}

export async function createTag(data: {
  name: string;
  color: string;
  created_by: string;
}): Promise<Tag> {
  const supabase = createClient();

  const { data: tag, error } = await supabase
    .from('tags')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return tag;
}

// ============================================================================
// LISTS
// ============================================================================

export async function getUserLists(userId: string): Promise<List[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function getListWithVenues(
  listId: string,
): Promise<ListWithVenues | null> {
  const supabase = createClient();

  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('*')
    .eq('id', listId)
    .single();

  if (listError) throw listError;
  if (!list) return null;

  const { data: venueLinks } = await supabase
    .from('list_venues')
    .select('venue_id')
    .eq('list_id', listId);

  if (venueLinks?.length) {
    const { data: venues } = await supabase
      .from('venues')
      .select('*')
      .in(
        'id',
        venueLinks.map((l) => l.venue_id),
      );

    return { ...list, venues: venues ?? [] };
  }

  return list;
}

export async function addVenueToList(
  listId: string,
  venueId: string,
  note?: string,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('list_venues')
    .insert({ list_id: listId, venue_id: venueId, note });

  if (error) throw error;
}

export async function removeVenueFromList(
  listId: string,
  venueId: string,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('list_venues')
    .delete()
    .eq('list_id', listId)
    .eq('venue_id', venueId);

  if (error) throw error;
}

export async function createList(data: {
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  is_public: boolean;
}): Promise<List> {
  const supabase = createClient();

  const { data: list, error } = await supabase
    .from('lists')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return list;
}

export async function updateList(
  id: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    is_public?: boolean;
  },
): Promise<List> {
  const supabase = createClient();
  const { data: list, error } = await supabase
    .from('lists')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return list;
}

export async function deleteList(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('lists').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// CREATE LOG (Combined Venue + Review)
// ============================================================================

export async function searchReviews(
  query: string,
  limit = 20,
): Promise<ReviewWithVenue[]> {
  const supabase = createClient();

  // Search for venues matching the query
  const { data: venues } = await supabase
    .from('venues')
    .select('id')
    .ilike('name', `%${query}%`);

  const venueIds = venues?.map((v) => v.id) ?? [];

  // Search reviews by text_review or by matching venue
  let reviewsQuery = supabase
    .from('reviews')
    .select(
      '*, venue:venues(*), likes(user_id, user:profiles(username)), comments(count), author:profiles(*)',
    )
    .order('visited_at', { ascending: false })
    .limit(limit);

  if (venueIds.length > 0) {
    reviewsQuery = reviewsQuery.or(
      `text_review.ilike.%${query}%,venue_id.in.(${venueIds.join(',')})`,
    );
  } else {
    reviewsQuery = reviewsQuery.ilike('text_review', `%${query}%`);
  }

  const { data: reviews, error } = await reviewsQuery;

  if (error) throw error;

  // Fetch tags for each review
  const reviewsWithTags = await Promise.all(
    (reviews ?? []).map(async (review) => {
      const { data: tagLinks } = await supabase
        .from('review_tags')
        .select('tag_id')
        .eq('review_id', review.id);

      if (tagLinks?.length) {
        const { data: tags } = await supabase
          .from('tags')
          .select('*')
          .in(
            'id',
            tagLinks.map((l) => l.tag_id),
          );

        return {
          ...review,
          tags: tags ?? [],
          _count: { comments: (review as any).comments?.[0]?.count || 0 },
        };
      }

      return {
        ...review,
        tags: [],
        _count: { comments: (review as any).comments?.[0]?.count || 0 },
        author: (review as any).author,
      };
    }),
  );

  return reviewsWithTags as ReviewWithVenue[];
}

export async function createLog(
  userId: string,
  data: CreateLogFormData,
): Promise<{ venue: Venue; review: Review }> {
  const supabase = createClient();

  let venueId = data.venue_id;
  let venue: Venue;

  // Create new venue if needed
  if (!venueId && data.venue_name) {
    const newVenue = await createVenue({
      name: data.venue_name,
      type: data.venue_type ?? 'restaurante',
      location: data.venue_location ?? {},
      created_by: userId,
    });
    venueId = newVenue.id;
    venue = newVenue;

    // Link cuisines
    if (data.cuisine_ids?.length) {
      await supabase.from('venue_cuisines').insert(
        data.cuisine_ids.map((cuisine_id) => ({
          venue_id: venueId!,
          cuisine_id,
        })),
      );
    }
  } else {
    const { data: existingVenue, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId!)
      .single();

    if (error || !existingVenue) throw error || new Error('Venue not found');
    venue = existingVenue;
  }

  // Create review
  const review = await createReview({
    user_id: userId,
    venue_id: venueId!,
    rating: data.rating,
    text_review: data.text_review,
    visited_at: data.visited_at,
    price_level: data.price_level,
    is_private: data.is_private,
    tag_ids: data.tag_ids,
  });

  return { venue, review };
}

// ============================================================================
// LIKES
// ============================================================================

export async function toggleLike(
  userId: string,
  reviewId: string,
): Promise<{ added: boolean }> {
  const supabase = createClient();

  // Check if like exists
  const { data: existingLike, error: checkError } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('review_id', reviewId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  if (existingLike) {
    // Unlike
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id);

    if (deleteError) throw deleteError;
    return { added: false };
  } else {
    // Like
    const { error: insertError } = await supabase
      .from('likes')
      .insert({ user_id: userId, review_id: reviewId });

    if (insertError) throw insertError;
    return { added: true };
  }
}

// ============================================================================
// ACCOUNT DELETION
// ============================================================================

export async function deleteAccount(userId: string): Promise<void> {
  const supabase = createClient();

  // Delete in correct order to respect foreign key constraints
  // 1. Delete likes
  await supabase.from('likes').delete().eq('user_id', userId);

  // 2. Delete review tags and reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId);
  if (reviews?.length) {
    await supabase
      .from('review_tags')
      .delete()
      .in(
        'review_id',
        reviews.map((r) => r.id),
      );
    await supabase
      .from('review_photos')
      .delete()
      .in(
        'review_id',
        reviews.map((r) => r.id),
      );
  }
  await supabase.from('reviews').delete().eq('user_id', userId);

  // 3. Delete list venues and lists
  const { data: lists } = await supabase
    .from('lists')
    .select('id')
    .eq('user_id', userId);
  if (lists?.length) {
    await supabase
      .from('list_venues')
      .delete()
      .in(
        'list_id',
        lists.map((l) => l.id),
      );
  }
  await supabase.from('lists').delete().eq('user_id', userId);

  // 4. Delete user-created venues and their relationships
  const { data: venues } = await supabase
    .from('venues')
    .select('id')
    .eq('created_by', userId);
  if (venues?.length) {
    await supabase
      .from('venue_cuisines')
      .delete()
      .in(
        'venue_id',
        venues.map((v) => v.id),
      );
  }
  await supabase.from('venues').delete().eq('created_by', userId);

  // 5. Delete user-created tags and cuisine types
  await supabase.from('tags').delete().eq('created_by', userId);
  await supabase.from('cuisine_types').delete().eq('created_by', userId);

  // 6. Delete profile
  await supabase.from('profiles').delete().eq('id', userId);
}

// ============================================================================
// COMMENTS
// ============================================================================

export async function getComments(logId: string) {
  const supabase = createClient();

  const { data: comments, error } = await supabase
    .from('comments')
    .select('*, user:profiles(*), likes:comment_likes(user_id)')
    .eq('log_id', logId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return comments || [];
}
