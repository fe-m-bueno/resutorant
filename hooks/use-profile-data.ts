'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, getReviewsByUser } from '@/lib/queries';
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

export function useUserReviews(userId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', userId],
    queryFn: async () => {
      if (!userId) return [];
      return getReviewsByUser(userId);
    },
    enabled: !!userId,
  });
}

export function useProfileData() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: profile, isLoading: isProfileLoading } = useProfile(user?.id);
  const { data: reviews, isLoading: isReviewsLoading } = useUserReviews(
    user?.id,
  );

  return {
    user,
    profile,
    reviews: reviews ?? [],
    isLoading: isUserLoading || isProfileLoading || isReviewsLoading,
  };
}
