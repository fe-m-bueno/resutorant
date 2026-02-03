'use client';

import { Check, Search } from 'lucide-react';
import { useState } from 'react';

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
// This avoids hardcoding hundreds of emojis and keeps the component lean
const { ALL_EMOJIS, EMOJI_NAMES_MAP } = (() => {
  try {
    const emojis: string[] = [];
    const namesMap: Record<string, string> = {};
    
    // emoji-name-map stores emojis as :name: -> character
    Object.entries(emojiMap.emoji).forEach(([name, char]) => {
      const cleanName = name.replace(/:/g, '');
      if (!emojis.includes(char)) {
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

interface EmojiPickerProps {
  value?: string;
  onChange: (value: string) => void;
  trigger?: React.ReactNode;
}

export function EmojiPicker({ value, onChange, trigger }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredEmojis = ALL_EMOJIS.filter((emoji) => {
    if (!search) return true;
    const s = search.toLowerCase();
    // Search in name map (English)
    return EMOJI_NAMES_MAP[emoji]?.toLowerCase().includes(s);
  });

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
              />
            </div>
          </div>
          <div className="h-[300px] overflow-y-auto p-2 custom-scrollbar">
            {filteredEmojis.length > 0 ? (
              <div className="grid grid-cols-7 gap-1">
                {filteredEmojis.map((emoji, index) => (
                  <button
                    key={`${emoji}-${index}`}
                    type="button"
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors',
                      value === emoji && 'bg-muted ring-2 ring-primary',
                    )}
                    onClick={() => {
                      onChange(emoji);
                      setIsOpen(false);
                    }}
                    title={EMOJI_NAMES_MAP[emoji] || emoji}
                  >
                    <Twemoji emoji={emoji} className="h-5 w-5" />
                  </button>
                ))}
              </div>
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
