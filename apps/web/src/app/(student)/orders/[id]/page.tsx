'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ORDER_STATUS_META,
  OrderStatus,
  isTerminal,
} from '@campus-bytes/types';
import { ArrowLeft, MapPin, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge, EmptyState, ErrorState, Skeleton, StatusPill } from '@campus-bytes/ui';
import { getOrder } from '@/data/client';
import { formatCurrency, formatTime } from '@/lib/format';
import { OrderTimeline } from '@/components/student/order-timeline';
import { CartTracker } from '@/components/student/cart-tracker';
import { useOrderRealtime } from '@/lib/realtime';

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  // Instant status updates over the authenticated socket (student only receives
  // their own order events). A 20s poll remains as a reconnect fallback.
  useOrderRealtime([['order', id], ['orders']]);
  const { data: o, isLoading, isError, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s && !isTerminal(s) ? 20000 : false;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;
  if (!o) return <div className="p-6"><EmptyState title="Order not found" /></div>;

  const meta = ORDER_STATUS_META[o.status];
  const rejected = o.status === OrderStatus.REJECTED || o.status === OrderStatus.CANCELLED;
  const showCart =
    o.status === OrderStatus.OUT_FOR_DELIVERY && o.cartLabel && o.deliveryHostelName;

  return (
    <div className="flex flex-col gap-4 px-4 pb-10 pt-4 md:px-6">
      <div className="flex items-center gap-3">
        <Link href="/orders" aria-label="Back" className="text-ink-700 hover:text-ink-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900">Order #{o.code}</h1>
          <p className="text-2xs text-ink-400">Placed at {formatTime(o.placedAt)}</p>
        </div>
      </div>

      {/* Status banner */}
      <div className="flex items-center justify-between rounded-lg border border-line bg-surface p-4">
        <div>
          <p className="text-2xs uppercase tracking-wide text-ink-400">Current status</p>
          <p className="font-display text-lg font-semibold text-ink-900">{meta.label}</p>
        </div>
        <StatusPill tone={meta.tone} label={meta.label} />
      </div>

      {showCart && <CartTracker cartLabel={o.cartLabel!} hostelName={o.deliveryHostelName!} />}

      {/* Timeline or terminal message */}
      {rejected ? (
        <div className="flex items-start gap-3 rounded-lg border border-error/30 bg-error-soft p-4">
          <XCircle className="mt-0.5 h-5 w-5 text-error" />
          <div>
            <p className="font-semibold text-ink-900">
              {o.status === OrderStatus.REJECTED ? 'Order rejected' : 'Order cancelled'}
            </p>
            {o.rejectionReason && <p className="text-sm text-ink-600">{o.rejectionReason}</p>}
            <p className="mt-1 text-xs text-ink-400">Your payment has been refunded.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-surface p-4">
          <h2 className="mb-4 font-display font-semibold text-ink-900">Progress</h2>
          <OrderTimeline status={o.status} />
        </div>
      )}

      {/* Delivery location */}
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface p-4">
        <MapPin className="h-4 w-4 text-brand-600" />
        <p className="text-sm text-ink-900">
          {o.deliveryHostelName} · Room {o.deliveryRoomNo}
        </p>
      </div>

      {/* Items + bill */}
      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display font-semibold text-ink-900">{o.restaurantName}</h2>
          <Badge tone="neutral" size="sm">Online · Paid</Badge>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {o.items.map((i) => (
            <li key={i.id} className="flex justify-between">
              <span className="text-ink-700">
                {i.quantity} × {i.nameSnapshot}
              </span>
              <span className="tabular-nums text-ink-900">
                {formatCurrency(i.priceSnapshot * i.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-dashed border-line pt-3 font-semibold text-ink-900">
          <span>Total paid</span>
          <span className="font-display">{formatCurrency(o.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
