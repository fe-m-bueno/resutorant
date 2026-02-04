"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { togglePlanToGo } from '@/lib/actions/plans';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface PlanButtonProps {
  venueId: string;
  initialIsPlanned: boolean;
  userId?: string;
}

export function PlanButton({ venueId, initialIsPlanned, userId }: PlanButtonProps) {
  const [isPlanned, setIsPlanned] = useState(initialIsPlanned);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    if (!userId) {
      toast.error("Você precisa estar logado para planejar ir.");
      return;
    }

    const newState = !isPlanned;
    setIsPlanned(newState); // Optimistic update
    setIsLoading(true);

    try {
      await togglePlanToGo(venueId);
      toast.success(newState ? "Adicionado aos planos!" : "Removido dos planos.");
      router.refresh();
    } catch (error) {
      setIsPlanned(!newState); // Revert on failure
      console.error(error);
      toast.error("Erro ao atualizar planos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isPlanned ? "secondary" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "gap-2",
        isPlanned && "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
      )}
    >
      {isPlanned ? (
        <>
          <BookmarkCheck className="h-4 w-4" />
          <span>Planejado</span>
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" />
          <span>Planejo Ir</span>
        </>
      )}
    </Button>
  );
}
