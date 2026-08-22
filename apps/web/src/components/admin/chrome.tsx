'use client';

import { useQuery } from '@tanstack/react-query';
import { LogOut, Search, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sidebar, MobileNavRail } from '@/components/dashboard/sidebar';
import { ADMIN_NAV } from '@/components/admin/nav';
import { getAdminOverview } from '@/data/admin';
import { logout } from '@/lib/auth-api';

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const overview = useQuery({ queryKey: ['admin-overview'], queryFn: getAdminOverview });
  const nav = ADMIN_NAV.map((item) =>
    item.href === '/admin/approvals'
      ? { ...item, badge: overview.data?.pendingApprovals }
      : item.href === '/admin/support'
        ? { ...item, badge: overview.data?.openTickets }
        : item,
  );

  return (
    <div className="flex min-h-dvh bg-surface-cream">
      <Sidebar
        items={nav}
        panelLabel="Admin"
        homeHref="/admin"
        footer={
          <div className="flex items-center gap-2 rounded-md bg-surface-cream px-3 py-2 text-xs text-ink-600">
            <ShieldCheck className="h-4 w-4 text-success" />
            NIMS University
          </div>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 md:w-80">
            <Search className="h-4 w-4 text-ink-400" />
            <input
              placeholder="Search orders, restaurants, students…"
              className="h-9 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight text-ink-900">Rohan Kapadia</p>
              <p className="text-2xs text-ink-400">Campus Administrator</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              RK
            </div>
            <button
              aria-label="Log out"
              title="Log out"
              onClick={async () => {
                await logout();
                router.replace('/login?next=admin');
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-surface-cream hover:text-error"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>
        <MobileNavRail items={nav} />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-dashboard">{children}</div>
        </main>
      </div>
    </div>
  );
}
