'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { addComment } from '@/lib/actions/comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CommentFormProps {
  logId: string;
  parentId?: string;
  onSuccess?: (comment?: any) => void;
  autoFocus?: boolean;
}

export function CommentForm({
  logId,
  parentId,
  onSuccess,
  autoFocus,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const newComment = await addComment(logId, content, parentId);
      setContent('');
      onSuccess?.(newComment);
      toast.success('Comentário enviado!');
    } catch (error) {
      toast.error('Erro ao enviar comentário.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          parentId ? 'Escreva sua resposta...' : 'Adicione um comentário...'
        }
        className="min-h-[80px] bg-background/50 resize-none pr-12 text-sm"
        maxLength={280}
        autoFocus={autoFocus}
      />
      <div className="absolute bottom-2 right-2 flex items-center gap-2">
        <span className="text-xs text-muted-foreground/50">
          {content.length}/280
        </span>
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || isSubmitting}
          className="h-8 w-8 rounded-full"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
