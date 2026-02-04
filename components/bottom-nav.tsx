'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Plus,
  List,
  User,
  ChefHat,
  MapPin as VenuesIcon,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  isFab?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/venues', icon: VenuesIcon, label: 'Lugares' },
  { href: '/planned', icon: Calendar, label: 'Planejo Ir' },
  { href: '#add', icon: Plus, label: 'Adicionar', isFab: true },
  { href: '/search', icon: Search, label: 'Buscar' },
  { href: '/lists', icon: List, label: 'Listas' },
  { href: '/profile', icon: User, label: 'Perfil' },
];

interface BottomNavProps {
  onAddClick?: () => void;
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-t border-border/30 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isFab) {
            return (
              <div key={item.href} className="flex flex-1 justify-center">
                <button
                  onClick={onAddClick}
                  className="relative -mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-110 hover:shadow-primary/50 active:scale-95 border-4 border-background/20"
                  aria-label={item.label}
                >
                  <Icon className="h-6 w-6" />
                  <div className="absolute inset-0 rounded-full animate-pulse-slow bg-primary/20 -z-10 scale-125" />
                </button>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 min-w-0 transition-all duration-300',
                isActive
                  ? 'text-primary translate-y-[-2px]'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <div
                className={cn(
                  'relative flex items-center justify-center p-1 rounded-xl transition-all',
                  isActive && 'bg-primary/10',
                )}
              >
                <Icon
                  className={cn(
                    'h-[18px] w-[18px]',
                    isActive && 'stroke-[2.5]',
                  )}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgb(var(--primary))]" />
                )}
              </div>
              <span className="text-[9px] font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis px-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
