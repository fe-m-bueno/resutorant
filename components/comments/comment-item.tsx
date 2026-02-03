'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, MessageCircle, Trash2, CornerDownRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CommentWithUser } from '@/lib/types';
import { deleteComment, toggleCommentLike } from '@/lib/actions/comments';
import { CommentForm } from './comment-form';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Using a forwardRef or just circular import for List?
// We will pass the list component as children or handle recursion in List.
// Best approach: CommentItem displays its content and renders children (replies).

interface CommentItemProps {
  comment: CommentWithUser;
  currentUserId?: string;
  logOwnerId?: string;
  onReply?: (commentId: string) => void;
  replyingToId?: string | null;
  logId: string;
}

export function CommentItem({
  comment,
  currentUserId,
  logOwnerId,
  onReply,
  replyingToId,
  logId,
}: CommentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const isOwner = currentUserId === comment.user_id;
  const isLogOwner = currentUserId === logOwnerId;
  const canDelete = isOwner || isLogOwner;
  const isLiked = comment.likes?.some((l) => l.user_id === currentUserId);
  const likesCount = comment.likes?.length || 0;

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;
    setIsDeleting(true);
    try {
      await deleteComment(comment.id);
      toast.success('Comentário excluído.');
    } catch (error) {
      toast.error('Erro ao excluir comentário.');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) return;
    try {
      await toggleCommentLike(comment.id);
    } catch (error) {
      toast.error('Erro ao curtir comentário.');
    }
  };

  return (
    <div
      className={cn(
        'group animate-in fade-in slide-in-from-top-2 duration-300',
        isDeleting && 'opacity-50 pointer-events-none',
      )}
    >
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.user?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {comment.user?.username?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {comment.user?.username}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>

          <p className="text-sm text-foreground/90 whitespace-pre-wrap word-break-break-word">
            {comment.content}
          </p>

          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors hover:text-red-500',
                isLiked ? 'text-red-500' : 'text-muted-foreground',
              )}
            >
              <Heart className={cn('h-3.5 w-3.5', isLiked && 'fill-current')} />
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>

            <button
              onClick={() => onReply?.(comment.id)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Responder
            </button>

            {canDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {replyingToId === comment.id && (
        <div className="mt-3 pl-11">
          <CommentForm
            logId={logId}
            parentId={comment.id}
            onSuccess={(newComment) => {
              if (newComment) {
                queryClient.setQueryData(
                  ['comments', logId],
                  (oldData: CommentWithUser[] | undefined) => {
                    if (!oldData) return [newComment];
                    return [...oldData, newComment];
                  },
                );
              }
              onReply?.('');
            }}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
