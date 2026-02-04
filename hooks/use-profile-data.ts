'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, getReviewsByUser, getProfileByUsername, getUserListsWithCounts, getPlannedVenuesForUser } from '@/lib/queries';
import { createClient } from '@/lib/supabase/client';
import { Profile, ReviewWithVenue } from '@/lib/types';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity, // User session shouldn't change often without explicit action
  });
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      return getProfile(userId);
    },
    enabled: !!userId,
  });
}

export function useUserReviews(
  userId: string | undefined,
  viewerId?: string,
) {
  return useQuery({
    queryKey: ['reviews', userId, viewerId],
    queryFn: async () => {
      if (!userId) return [];
      return getReviewsByUser(userId, viewerId);
    },
    enabled: !!userId,
  });
}

export function useUserLists(
  userId: string | undefined,
  options?: { includePrivate?: boolean },
) {
  return useQuery({
    queryKey: ['lists', userId, options?.includePrivate],
    queryFn: async () => {
      if (!userId) return [];
      return getUserListsWithCounts(userId, options);
    },
    enabled: !!userId,
  });
}

export function useUserPlannedVenues(userId: string | undefined) {
  return useQuery({
    queryKey: ['planned_venues', userId],
    queryFn: async () => {
      if (!userId) return [];
      return getPlannedVenuesForUser(userId);
    },
    enabled: !!userId,
  });
}

export function usePublicProfile(username: string) {
  // 1. Fetch Profile by Username
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      if (!username) return null;
      // Handle the @ prefix if present
      const cleanUsername =
        username.startsWith('%40') || username.startsWith('@')
          ? username.replace(/^%40|^@/, '')
          : username;
      return getProfileByUsername(cleanUsername);
    },
    enabled: !!username,
  });

  // Get current user ID for privacy filtering
  const { data: currentUser } = useUser();

  // 2. Fetch Reviews for that user (only if profile found)
  const { data: reviews, isLoading: isReviewsLoading } = useQuery({
    queryKey: ['reviews', profile?.id, currentUser?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      return getReviewsByUser(profile.id, currentUser?.id);
    },
    enabled: !!profile?.id,
  });

  // 3. Fetch Lists for that user (only public)
  const { data: lists, isLoading: isListsLoading } = useQuery({
    queryKey: ['lists', profile?.id, false],
    queryFn: async () => {
      if (!profile?.id) return [];
      return getUserListsWithCounts(profile.id, { includePrivate: false });
    },
    enabled: !!profile?.id,
  });

  // 4. Fetch Planned Venues for that user
  const { data: plannedVenues, isLoading: isPlannedLoading } = useQuery({
    queryKey: ['planned_venues', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      return getPlannedVenuesForUser(profile.id);
    },
    enabled: !!profile?.id,
  });

  return {
    profile,
    reviews: reviews ?? [],
    lists: lists ?? [],
    plannedVenues: plannedVenues ?? [],
    isLoading:
      isProfileLoading ||
      (!!profile &&
        (isReviewsLoading || isListsLoading || isPlannedLoading)),
    notFound: !isProfileLoading && !profile,
  };
}

export function useProfileData() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: profile, isLoading: isProfileLoading } = useProfile(user?.id);
  const { data: reviews, isLoading: isReviewsLoading } = useUserReviews(
    user?.id,
    user?.id, // Pass user.id as viewerId to see own private reviews
  );
  const { data: lists, isLoading: isListsLoading } = useUserLists(user?.id, {
    includePrivate: true,
  });
  const { data: plannedVenues, isLoading: isPlannedLoading } = useUserPlannedVenues(user?.id);

  return {
    user,
    profile,
    reviews: reviews ?? [],
    lists: lists ?? [],
    plannedVenues: plannedVenues ?? [],
    isLoading:
      isUserLoading ||
      isProfileLoading ||
      isReviewsLoading ||
      isListsLoading ||
      isPlannedLoading,
  };
}
