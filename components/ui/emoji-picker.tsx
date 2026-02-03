'use client';

import { Search } from 'lucide-react';
import { useState, useMemo, useDeferredValue, useCallback, memo, useEffect, useRef } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import emojiMap from 'emoji-name-map';
import { cn } from '@/lib/utils';
import { Twemoji } from './twemoji';

// Dynamically generate emoji list and mapping from the library
// Uses Set for O(1) lookup instead of Array.includes() for O(n)
const { ALL_EMOJIS, EMOJI_NAMES_MAP } = (() => {
  try {
    const seen = new Set<string>();
    const emojis: string[] = [];
    const namesMap: Record<string, string> = {};
    
    // emoji-name-map stores emojis as :name: -> character
    Object.entries(emojiMap.emoji).forEach(([name, char]) => {
      const cleanName = name.replace(/:/g, '');
      if (!seen.has(char)) {
        seen.add(char);
        emojis.push(char);
      }
      // Combine names if emoji appears multiple times with different aliases
      namesMap[char] = namesMap[char] 
        ? `${namesMap[char]} ${cleanName}`
        : cleanName;
    });

    return { ALL_EMOJIS: emojis, EMOJI_NAMES_MAP: namesMap };
  } catch (e) {
    console.error('Error initializing emoji data:', e);
    return { ALL_EMOJIS: [] as string[], EMOJI_NAMES_MAP: {} as Record<string, string> };
  }
})();

// Memoized emoji button to prevent unnecessary re-renders
const EmojiButton = memo(({ 
  emoji, 
  isSelected, 
  onSelect, 
  title 
}: { 
  emoji: string; 
  isSelected: boolean; 
  onSelect: (emoji: string) => void;
  title: string;
}) => (
  <button
    type="button"
    className={cn(
      'flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors',
      isSelected && 'bg-muted ring-2 ring-primary',
    )}
    onClick={() => onSelect(emoji)}
    title={title}
  >
    <Twemoji emoji={emoji} className="h-5 w-5" />
  </button>
));

EmojiButton.displayName = 'EmojiButton';

interface EmojiPickerProps {
  value?: string;
  onChange: (value: string) => void;
  trigger?: React.ReactNode;
}

export function EmojiPicker({ value, onChange, trigger }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(70); // Initial load: 10 rows x 7 cols
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Defer the search value to keep UI responsive while typing
  const deferredSearch = useDeferredValue(search);

  // Get all filtered emojis (not limited)
  const allFilteredEmojis = useMemo(() => {
    if (!deferredSearch) {
      return ALL_EMOJIS;
    }
    
    const s = deferredSearch.toLowerCase();
    return ALL_EMOJIS.filter((emoji) => 
      EMOJI_NAMES_MAP[emoji]?.toLowerCase().includes(s)
    );
  }, [deferredSearch]);

  // Slice to show only displayCount emojis
  const visibleEmojis = useMemo(() => {
    return allFilteredEmojis.slice(0, displayCount);
  }, [allFilteredEmojis, displayCount]);

  const hasMore = visibleEmojis.length < allFilteredEmojis.length;

  // Reset display count when search changes
  useEffect(() => {
    setDisplayCount(70);
  }, [deferredSearch]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!isOpen) return; // Don't observe when popover is closed
    if (!hasMore) return; // Don't observe if no more items
    
    let observer: IntersectionObserver | null = null;
    
    // Use setTimeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      if (!scrollContainerRef.current) return;
      if (!observerTarget.current) return;

      const container = scrollContainerRef.current;
      const target = observerTarget.current;
      const totalLength = allFilteredEmojis.length;

      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            // Load 70 more emojis (10 rows)
            setDisplayCount((prev) => {
              const next = prev + 70;
              return Math.min(next, totalLength);
            });
          }
        },
        { 
          root: container,
          threshold: 0,
          rootMargin: '100px' // Start loading well before reaching the end
        }
      );

      observer.observe(target);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      if (observer && observerTarget.current) {
        observer.unobserve(observerTarget.current);
        observer.disconnect();
      }
    };
  }, [isOpen, hasMore, allFilteredEmojis.length]);

  // Memoized handler to avoid recreating on each render
  const handleSelect = useCallback((emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
    setSearch(''); // Reset search on select
  }, [onChange]);

  // Show loading state while deferred value is updating
  const isSearching = search !== deferredSearch;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="icon"
            className="flex items-center justify-center p-0"
          >
            <Twemoji emoji={value || '🍽️'} className="h-6 w-6" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="flex flex-col">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar emoji..."
                className="pl-8 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <div ref={scrollContainerRef} className="h-[300px] overflow-y-auto p-2">
            {isSearching ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">Buscando...</p>
              </div>
            ) : visibleEmojis.length > 0 ? (
              <>
                <div className="grid grid-cols-7 gap-1">
                  {visibleEmojis.map((emoji) => (
                    <EmojiButton
                      key={emoji}
                      emoji={emoji}
                      isSelected={value === emoji}
                      onSelect={handleSelect}
                      title={EMOJI_NAMES_MAP[emoji] || emoji}
                    />
                  ))}
                </div>
                {/* Sentinel element for infinite scroll */}
                {hasMore && (
                  <div 
                    ref={observerTarget}
                    className="flex items-center justify-center py-4 text-muted-foreground"
                  >
                    <p className="text-xs">Carregando mais...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                <p className="text-sm">Nenhum emoji encontrado</p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Static method to prefetch common emojis
EmojiPicker.prefetch = () => {
  if (typeof window === 'undefined') return;
  
  // Prefetch first few emojis to Prime the cache
  const emojisToPrefetch = ALL_EMOJIS.slice(0, 50);
  
  emojisToPrefetch.forEach(emoji => {
    const codePoint = Array.from(emoji)
      .map(char => char.codePointAt(0)?.toString(16))
      .filter(Boolean)
      .join('-');
    
    const img = new Image();
    img.src = `https://twemoji.maxcdn.com/v/latest/svg/${codePoint}.svg`;
  });
};
