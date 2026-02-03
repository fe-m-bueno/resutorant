'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddLogModal } from '@/components/add-log-modal';
import type { VenueWithCuisines } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function AddLogButton({ venue }: { venue: VenueWithCuisines }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm" variant="outline" className="gap-2">
        <Plus className="h-4 w-4" />
        Avaliar
      </Button>
      <AddLogModal
        open={isOpen}
        onOpenChange={setIsOpen}
        initialVenue={venue}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
