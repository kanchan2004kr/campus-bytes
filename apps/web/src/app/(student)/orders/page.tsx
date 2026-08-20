'use client';

import { useQuery } from '@tanstack/react-query';
import { ORDER_STATUS_META, isTerminal } from '@campus-bytes/types';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { EmptyState, ErrorState, Skeleton, StatusPill, buttonVariants, cn } from '@campus-bytes/ui';
import { getOrders } from '@/data/client';
import { formatCurrency, formatRelative } from '@/lib/format';

export default function OrdersPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['orders'], queryFn: getOrders });

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 md:px-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">My orders</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.length > 0 ? (
        <div className="flex flex-col gap-3 pb-6">
          {data.map((o) => {
            const meta = ORDER_STATUS_META[o.status];
            const active = !isTerminal(o.status);
            return (
              <Link
                key={o.id}
                href={`/orders/${o.code}`}
                className={cn(
                  'rounded-lg border bg-surface p-4 shadow-sm transition-all hover:shadow-md',
                  active ? 'border-brand-200' : 'border-line',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-semibold text-ink-900">{o.restaurantName}</p>
                    <p className="text-2xs text-ink-400">
                      #{o.code} · {formatRelative(o.placedAt)}
                    </p>
                  </div>
                  <StatusPill tone={meta.tone} label={meta.label} size="sm" />
                </div>
                <p className="mt-2 line-clamp-1 text-sm text-ink-600">
                  {o.items.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(', ')}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold text-ink-900">{formatCurrency(o.grandTotal)}</span>
                  <span className="text-sm font-medium text-brand-600">
                    {active ? 'Track order →' : o.status === 'delivered' ? 'Rate order →' : 'View →'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="When you place an order, you’ll be able to track it live here."
          action={
            <Link href="/food" className={cn(buttonVariants({ size: 'md' }))}>
              Order now
            </Link>
          }
        />
      )}
    </div>
  );
}
