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
import { cn } from '@/lib/utils';
import { Twemoji } from './twemoji';

const FOOD_EMOJIS = [
  // Fruits
  '🍎',
  '🍎',
  '🍏',
  '🍐',
  '🍊',
  '🍋',
  '🍌',
  '🍉',
  '🍇',
  '🍓',
  '🫐',
  '🍈',
  '🍒',
  '🍑',
  '🥭',
  '🍍',
  '🥥',
  '🥝',
  // Vegetables
  '🍅',
  '🍆',
  '🥑',
  '🥦',
  '🥬',
  '🥒',
  '🌶️',
  '🫑',
  '🌽',
  '🥕',
  '🫒',
  '🧄',
  '🧅',
  '🍄',
  '🥜',
  '🫘',
  '🌰',
  // Prepared Foods
  '🍞',
  '🥐',
  '🥖',
  '🫓',
  '🥨',
  '🥯',
  '🥞',
  '🧇',
  '🧀',
  '🍖',
  '🍗',
  '🥩',
  '🥓',
  '🍔',
  '🍟',
  '🍕',
  '🌭',
  '🥪',
  '🌮',
  '🌯',
  '🫔',
  '🥙',
  '🧆',
  '🥚',
  '🍳',
  '🥘',
  '🍲',
  '🥣',
  '🥗',
  '🍿',
  '🧈',
  '🧂',
  '🥫',
  // Asian
  '🍱',
  '🍘',
  '🍙',
  '🍚',
  '🍛',
  '🍜',
  '🍝',
  '🍠',
  '🍢',
  '🍣',
  '🍤',
  '🍥',
  '🥮',
  '🍡',
  '🥟',
  '🥠',
  '🥡',
  // Sweets
  '🍦',
  '🍧',
  '🍨',
  '🍩',
  '🍪',
  '🎂',
  '🍰',
  '🧁',
  '🥧',
  '🍫',
  '🍬',
  '🍭',
  '🍮',
  '🍯',
  // Drinks
  '🍼',
  '🥛',
  '☕',
  '🫖',
  '🍵',
  '🍶',
  '🍾',
  '🍷',
  '🍸',
  '🍹',
  '🍺',
  '🍻',
  '🥂',
  '🥃',
  '🥤',
  '🧋',
  '🧃',
  '🧉',
  '🧊',
  // Utensils
  '🥢',
  '🍽️',
  '🍴',
  '🥄',
  '🔪',
  '🏺',
];

interface EmojiPickerProps {
  value?: string;
  onChange: (value: string) => void;
  trigger?: React.ReactNode;
}

export function EmojiPicker({ value, onChange, trigger }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredEmojis = FOOD_EMOJIS.filter((emoji) => {
    if (!search) return true;
    // In a real app, you might have names for emojis, but here we just filter by the emoji itself
    // Or we could add a list of labels for each emoji.
    return true;
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
      <PopoverContent className="w-64 p-2" align="start">
        <div className="flex flex-col gap-2">
          {/* 
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar emoji..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          */}
          <div className="h-48 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-6 gap-1">
              {FOOD_EMOJIS.map((emoji, index) => (
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
                >
                  <Twemoji emoji={emoji} className="h-6 w-6" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
