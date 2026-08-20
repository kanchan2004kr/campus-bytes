'use client';

import { Home, ClipboardList, UtensilsCrossed, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@campus-bytes/ui';
import { useCartStore } from '@/stores/cart-store';

const TABS = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/food', label: 'Food', icon: UtensilsCrossed, match: (p: string) => p.startsWith('/food') || p.startsWith('/restaurant') },
  { href: '/orders', label: 'My Orders', icon: ClipboardList, match: (p: string) => p.startsWith('/orders') },
  { href: '/profile', label: 'Profile', icon: User, match: (p: string) => p.startsWith('/profile') },
];

export function StudentBottomNav() {
  const pathname = usePathname();
  const count = useCartStore((s) => s.itemCount());

  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-content border-t border-line bg-bg/95 backdrop-blur md:hidden"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-2xs font-medium transition-colors',
                  active ? 'text-brand-600' : 'text-ink-400 hover:text-ink-700',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                  {tab.href === '/orders' && count > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
