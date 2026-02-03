'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Profile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export function UserCard({ profile }: { profile: Profile }) {
  return (
    <Link href={`/@${profile.username}`}>
      <div className="group flex items-center gap-3 p-4 rounded-2xl border bg-card hover:border-primary/20 hover:shadow-md transition-all">
        <Avatar className="h-12 w-12 rounded-full border">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback>
            {profile.username?.charAt(0).toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h3 className="font-medium truncate group-hover:text-primary transition-colors">
            @{profile.username}
          </h3>
          {profile.bio && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border bg-card">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}
