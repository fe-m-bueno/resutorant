'use client';

import {
  LucideIcon,
  Tag,
  Utensils,
  List as ListIcon,
  User,
  Shield,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';

interface SidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const items: SidebarItem[] = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'tags', label: 'Tags', icon: Tag },
  { id: 'cuisines', label: 'Culinárias', icon: Utensils },
  { id: 'lists', label: 'Listas', icon: ListIcon },
  { id: 'appearance', label: 'Aparência', icon: Moon },
  { id: 'security', label: 'Segurança e Privacidade', icon: Shield },
];

export function SettingsSidebar({
  currentSection,
  onSectionChange,
}: SidebarProps) {
  return (
    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto pb-2 lg:pb-0">
      {items.map((item) => (
        <Button
          key={item.id}
          variant={currentSection === item.id ? 'secondary' : 'ghost'}
          className={cn(
            'justify-start whitespace-nowrap',
            currentSection === item.id && 'bg-muted',
          )}
          onClick={() => {
            onSectionChange(item.id);
            if (item.id === 'cuisines') {
              EmojiPicker.prefetch();
            }
          }}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
