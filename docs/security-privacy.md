# Security and Privacy Policies

This document describes the security and privacy policies implemented in Resutorant, including the Row Level Security (RLS) rules and the explicit checks in the application layer.

## Overview

Resutorant takes a **defense-in-depth** approach to protecting private data:

1. **RLS (Row Level Security)** in the Supabase database as the first line of defense
2. **Explicit filters in the application layer** as an additional layer of protection
3. **Ownership validation** on write operations (update/delete)

## Sensitive Tables

### Reviews (`reviews`)

**Privacy fields:**
- `is_private` (boolean): Indicates whether the review is private or public

**Access policies:**
- **Public reviews** (`is_private = false`): Visible to all authenticated users
- **Private reviews** (`is_private = true`): Visible only to:
  - The author themselves (`user_id = viewer_id`)
  - Administrators (where applicable)

**Affected queries:**
- `getRecentReviews()` — Filters out private reviews, except the viewer's own
- `getReviewsByUser()` — Shows only public reviews when viewer ≠ owner
- `searchReviews()` — Filters out private reviews, except the viewer's own
- `getVenueReviews()` — Filters out private reviews, except the viewer's own
- `getComments()` — Checks whether the review is public before showing comments

### Lists (`lists`)

**Privacy fields:**
- `is_public` (boolean): Indicates whether the list is public or private

**Access policies:**
- **Public lists** (`is_public = true`): Visible to all authenticated users
- **Private lists** (`is_public = false`): Visible only to:
  - The owner themselves (`user_id = viewer_id`)

**Affected queries:**
- `getListDetails()` — Filters out private lists, except the viewer's own
- `searchLists()` — Already filters to public lists only
- `getUserListsWithCounts()` — Honors `includePrivate` when viewer = owner

**Special note:** When a public list contains items with private reviews, those reviews are filtered out of the `getListDetails()` response if the viewer is not the review's owner.

### Comments (`comments`)

**Access policies:**
- Comments are visible only if the associated review (`log_id`) is:
  - Public (`is_private = false`), OR
  - Private but owned by the viewer (`user_id = viewer_id`)

**Affected queries:**
- `getComments()` — Checks the review's privacy before returning comments

### Profiles (`profiles`)

**Access policies:**
- Profiles are public by default (only `username` is required)
- Sensitive information (email, and so on) is managed by Supabase Auth

**Affected queries:**
- `getProfile()` — Always returns the full profile (public data)
- `getProfileByUsername()` — Returns a public profile by username
- `searchProfiles()` — Searches public profiles

## Technical Implementation

### Explicit Filter Pattern

Every public query follows this pattern:

```typescript
// Example: getRecentReviews
export async function getRecentReviews(
  limit: number,
  viewerId?: string, // ID of the viewing user (optional)
): Promise<ReviewWithVenue[]> {
  let query = supabase.from('reviews').select('*');

  // Explicit privacy filter
  if (viewerId) {
    // Show public reviews OR the viewer's own
    query = query.or(`is_private.eq.false,user_id.eq.${viewerId}`);
  } else {
    // Without a viewerId, public reviews only
    query = query.eq('is_private', false);
  }

  // ... rest of the query
}
```

### Passing viewerId

`viewerId` must be passed on every public query call:

```typescript
// In client-side components
const { data: { user } } = await supabase.auth.getUser();
const reviews = await getRecentReviews(20, user?.id);

// In server components
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const reviews = await getVenueReviews(venueId, user?.id);
```

## Expected RLS Policies

Although the code implements explicit filters, the following RLS policies must exist in the database:

### Reviews
- **SELECT**: Users can see public reviews OR their own private reviews
- **INSERT**: Users can create reviews (with `user_id = auth.uid()`)
- **UPDATE**: Users can update only their own reviews
- **DELETE**: Users can delete only their own reviews (or admins can delete public ones)

### Lists
- **SELECT**: Users can see public lists OR their own private lists
- **INSERT**: Users can create lists (with `user_id = auth.uid()`)
- **UPDATE**: Users can update only their own lists
- **DELETE**: Users can delete only their own lists (or admins can delete public ones)

### Comments
- **SELECT**: Users can see comments on public reviews OR on their own private reviews
- **INSERT**: Users can comment on public reviews OR on their own private reviews
- **UPDATE/DELETE**: Users can modify only their own comments

## Ownership Validation

Write operations always validate ownership explicitly:

```typescript
// Example: updateLog
const { data: existingReview } = await supabase
  .from('reviews')
  .select('user_id')
  .eq('id', logId)
  .single();

if (existingReview.user_id !== userId) {
  throw new Error('Unauthorized');
}
```

## Admin Privileges

Administrators (`profiles.is_admin = true`) have special permissions:

- They can delete other users' public reviews
- They can delete other users' public lists
- They **cannot** access other users' private reviews or lists (by design)

## Security Checklist

When adding new public queries, check that:

- [ ] The query filters private data when `viewerId` is not the owner
- [ ] The query accepts an optional `viewerId` parameter
- [ ] All call sites pass `viewerId` when it is available
- [ ] Write operations validate ownership explicitly
- [ ] The documentation has been updated with the new query

## Auditing and Monitoring

Monitoring recommendations:

1. **Access logs**: Monitor attempts to access private data
2. **RLS violations**: Check the Supabase logs for policies that failed
3. **Query performance**: Explicit filters can affect performance at high volumes

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Defense in Depth](https://en.wikipedia.org/wiki/Defense_in_depth_(computing))
