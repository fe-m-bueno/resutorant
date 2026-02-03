import { useState } from 'react';
import { List as ListIcon, Globe, Lock, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteList } from '@/lib/queries';
import { toast } from 'sonner';
import type { List, Profile } from '@/lib/types';

import Link from 'next/link';

export function ListCard({ 
  list, 
  venueCount,
  currentUserProfile,
  onRefresh,
  author
}: { 
  list: List
  venueCount: number
  currentUserProfile?: Profile | null
  onRefresh?: () => void
  author?: { username: string | null }
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isOwner = currentUserProfile?.id === list.user_id;
  const isAdmin = currentUserProfile?.is_admin;
  const canDelete = !list.is_default && (isOwner || (isAdmin && list.is_public));

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta lista?')) return;
    
    setIsDeleting(true);
    try {
      await deleteList(list.id, currentUserProfile!.id, isAdmin);
      toast.success('Lista excluída com sucesso!');
      onRefresh?.();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir lista.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group relative rounded-2xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            {list.icon ? (
              <span className="text-lg">{list.icon}</span>
            ) : (
              <ListIcon className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium truncate">{list.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{venueCount} {venueCount === 1 ? 'lugar' : 'lugares'}</span>
              {author && (
                <>
                  <span>•</span>
                  <Link 
                    href={`/@${author.username}`}
                    className="hover:underline hover:text-foreground"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    @{author.username}
                  </Link>
                </>
              )}
              <span>•</span>
              {list.is_public ? (
                <span className="flex items-center gap-0.5">
                  <Globe className="h-3 w-3" />
                  Pública
                </span>
              ) : (
                <span className="flex items-center gap-0.5">
                  <Lock className="h-3 w-3" />
                  Privada
                </span>
              )}
            </div>
          </div>
        </div>
        
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir {isAdmin && !isOwner ? '(Admin)' : ''}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {list.description && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {list.description}
        </p>
      )}
      
      {list.is_default && (
        <span className="absolute top-2 right-2 text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          Padrão
        </span>
      )}
    </div>
  )
}

export function ListCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}
