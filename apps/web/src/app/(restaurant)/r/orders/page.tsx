'use client';

import { useQuery } from '@tanstack/react-query';
import { OrderStatus } from '@campus-bytes/types';
import { BellRing, ChefHat, PackageCheck, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Skeleton, cn } from '@campus-bytes/ui';
import { getLiveOrders, type RestaurantOrder } from '@/data/restaurant';
import { OrderCard } from '@/components/restaurant/order-card';

interface Column {
  key: OrderStatus;
  title: string;
  icon: LucideIcon;
  accent: string;
}

const COLUMNS: Column[] = [
  { key: OrderStatus.PLACED, title: 'New', icon: BellRing, accent: 'text-brand-600' },
  { key: OrderStatus.PREPARING, title: 'Preparing', icon: ChefHat, accent: 'text-warning-fg' },
  { key: OrderStatus.READY, title: 'Ready', icon: PackageCheck, accent: 'text-info' },
  { key: OrderStatus.OUT_FOR_DELIVERY, title: 'Out for delivery', icon: Truck, accent: 'text-brand-700' },
];

export default function LiveOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['r-orders'],
    queryFn: getLiveOrders,
    refetchInterval: 5000,
  });

  const byStatus = (status: OrderStatus): RestaurantOrder[] =>
    (data ?? []).filter((o) => o.status === status);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Live orders</h1>
        <p className="text-sm text-ink-600">
          Accept, prepare, and hand orders to university carts. Updates in real time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const orders = byStatus(col.key);
          const Icon = col.icon;
          return (
            <section key={col.key} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-md bg-surface px-3 py-2 shadow-sm">
                <Icon className={cn('h-4 w-4', col.accent)} />
                <h2 className="text-sm font-semibold text-ink-900">{col.title}</h2>
                <span className="ml-auto rounded-pill bg-surface-cream px-2 py-0.5 text-2xs font-bold text-ink-600">
                  {orders.length}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {isLoading ? (
                  <Skeleton className="h-48 rounded-lg" />
                ) : orders.length > 0 ? (
                  orders.map((o) => <OrderCard key={o.id} order={o} />)
                ) : (
                  <div className="rounded-lg border border-dashed border-line bg-surface/60 p-6 text-center text-xs text-ink-400">
                    Nothing here
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
