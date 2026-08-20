'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@campus-bytes/ui';
import { Logo } from '@/components/brand/logo';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export function Sidebar({
  items,
  panelLabel,
  footer,
}: {
  items: NavItem[];
  panelLabel: string;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <Logo size={30} />
      </div>
      <p className="px-5 pb-2 text-2xs font-semibold uppercase tracking-wider text-ink-400">
        {panelLabel}
      </p>
      <nav className="flex-1 space-y-0.5 px-3">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-surface-cream hover:text-ink-900',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={cn('h-[18px] w-[18px]', active && 'text-brand-600')} strokeWidth={active ? 2.3 : 2} />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-pill bg-brand-600 px-1.5 text-2xs font-bold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      {footer && <div className="border-t border-line p-3">{footer}</div>}
    </aside>
  );
}

/** Mobile: horizontal scrollable nav rail shown under the top bar. */
export function MobileNavRail({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:hidden">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-medium',
              active ? 'bg-brand-600 text-white' : 'bg-surface-cream text-ink-600',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
