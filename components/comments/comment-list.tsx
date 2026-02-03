'use client';

import { CommentWithUser } from '@/lib/types';
import { CommentItem } from './comment-item';

interface CommentListProps {
  comments: CommentWithUser[];
  currentUserId?: string;
  logOwnerId: string;
  onReply: (commentId: string) => void;
  replyingToId: string | null;
  logId: string;
}

export function CommentList({
  comments,
  currentUserId,
  logOwnerId,
  onReply,
  replyingToId,
  logId,
}: CommentListProps) {
  if (!comments.length) return null;

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="relative">
          <CommentItem
            comment={comment}
            currentUserId={currentUserId}
            logOwnerId={logOwnerId}
            onReply={onReply}
            replyingToId={replyingToId}
            logId={logId}
          />
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 pl-6 border-l-2 border-border/50 ml-3.5 space-y-4">
              <CommentList
                comments={comment.replies}
                currentUserId={currentUserId}
                logOwnerId={logOwnerId}
                onReply={onReply}
                replyingToId={replyingToId}
                logId={logId}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
