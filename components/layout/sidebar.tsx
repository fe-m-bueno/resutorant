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

interface SidebarProps {
  onAddClick?: () => void;
}

export function Sidebar({ onAddClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r bg-card z-50">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-6 h-16 border-b transition-colors hover:bg-muted/50"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ChefHat className="h-5 w-5" />
        </div>
        <span className="font-semibold text-lg">Resutorant</span>
      </Link>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-1 p-3">
        {navItems
          .filter((item) => !item.isFab)
          .map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                {item.label}
              </Link>
            );
          })}
      </div>

      {/* Add Button */}
      <div className="p-4 border-t">
        <button
          onClick={onAddClick}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Novo Log
        </button>
      </div>
    </nav>
  );
}
