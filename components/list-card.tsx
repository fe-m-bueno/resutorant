'use client';

import { List as ListIcon, Globe, Lock, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { List } from '@/lib/types';

export function ListCard({ 
  list, 
  venueCount,
  onDelete
}: { 
  list: List
  venueCount: number
  onDelete?: (id: string) => void
}) {
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
        
        {onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(list.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
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
