'use client';

import { Sidebar, MobileNavRail } from '@/components/dashboard/sidebar';
import { RESTAURANT_NAV } from '@/components/restaurant/nav';
import { RestaurantTopBar } from '@/components/restaurant/top-bar';
import { NewOrderWatcher } from '@/components/restaurant/new-order-watcher';
import { RequireRole } from '@/components/auth/require-role';

export function RestaurantChrome({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="restaurant">
    <div className="flex min-h-dvh bg-surface-cream">
      <Sidebar items={RESTAURANT_NAV} panelLabel="Restaurant" />
      <div className="flex min-w-0 flex-1 flex-col">
        <RestaurantTopBar />
        <MobileNavRail items={RESTAURANT_NAV} />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-dashboard">{children}</div>
        </main>
      </div>
      <NewOrderWatcher />
    </div>
    </RequireRole>
  );
}
