'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderKanban, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

const navItems = [
  { href: '/', label: 'Ana Sayfa', icon: Home },
  { href: '/categories', label: 'Kategoriler', icon: FolderKanban },
  { href: '/favorites', label: 'Favoriler', icon: Star },
  { href: '/profile', label: 'Profil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
