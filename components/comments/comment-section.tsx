'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageSquareOff } from 'lucide-react';
import { getComments } from '@/lib/queries'; // This imports from client logic
import { CommentForm } from './comment-form';
import { CommentList } from './comment-list';
import { CommentWithUser } from '@/lib/types';

interface CommentSectionProps {
  logId: string;
  currentUserId?: string;
  logOwnerId: string;
}

export function CommentSection({
  logId,
  currentUserId,
  logOwnerId,
}: CommentSectionProps) {
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: rawComments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['comments', logId, currentUserId],
    queryFn: () => getComments(logId, currentUserId),
    refetchInterval: 1000 * 60, // Refresh every minute
  });

  const handleCommentAdded = (newComment: CommentWithUser) => {
    queryClient.setQueryData(
      ['comments', logId],
      (oldData: CommentWithUser[] | undefined) => {
        if (!oldData) return [newComment];
        return [...oldData, newComment];
      },
    );
  };

  const commentsTree = useMemo(() => {
    if (!rawComments) return [];

    const commentsMap: Record<string, CommentWithUser> = {};
    const roots: CommentWithUser[] = [];

    // Clone comments to avoid mutating cache and add replies array
    rawComments.forEach((c) => {
      commentsMap[c.id] = { ...c, replies: [] };
    });

    // Build tree
    rawComments.forEach((c) => {
      if (c.parent_id && commentsMap[c.parent_id]) {
        commentsMap[c.parent_id].replies!.push(commentsMap[c.id]);
      } else {
        roots.push(commentsMap[c.id]);
      }
    });

    return roots;
  }, [rawComments]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
        <MessageSquareOff className="h-8 w-8 opacity-50" />
        <span className="text-sm">Erro ao carregar comentários</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* New Comment Input */}
      <div className="mb-6">
        <CommentForm logId={logId} onSuccess={handleCommentAdded} />
      </div>

      {/* Comments List */}
      {commentsTree.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Seja o primeiro a comentar!
        </div>
      ) : (
        <CommentList
          comments={commentsTree}
          currentUserId={currentUserId}
          logOwnerId={logOwnerId}
          onReply={(id) => setReplyingToId((prev) => (prev === id ? null : id))}
          replyingToId={replyingToId}
          logId={logId}
        />
      )}
    </div>
  );
}
