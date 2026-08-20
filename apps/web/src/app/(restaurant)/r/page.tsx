'use client';

import { useQuery } from '@tanstack/react-query';
import { OrderStatus, CART_STATUS_META } from '@campus-bytes/types';
import { BellRing, ChefHat, PackageCheck, IndianRupee, ArrowRight, Truck } from 'lucide-react';
import Link from 'next/link';
import { StatCard, StatusPill, Skeleton, cn } from '@campus-bytes/ui';
import { getRestaurantSummary, getLiveOrders, getCarts } from '@/data/restaurant';
import { formatCurrency } from '@/lib/format';

export default function RestaurantDashboard() {
  const summary = useQuery({ queryKey: ['r-summary'], queryFn: getRestaurantSummary });
  const orders = useQuery({ queryKey: ['r-orders'], queryFn: getLiveOrders });
  const carts = useQuery({ queryKey: ['r-carts'], queryFn: getCarts });
  const s = summary.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-600">Live snapshot of your kitchen operations.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.isLoading || !s ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : (
          <>
            <StatCard label="New orders" value={String(s.newCount)} icon={BellRing} accent="brand" />
            <StatCard label="Preparing" value={String(s.preparingCount)} icon={ChefHat} accent="warning" />
            <StatCard label="Ready" value={String(s.readyCount)} icon={PackageCheck} accent="info" />
            <StatCard label="Today's sales" value={formatCurrency(s.todaysRevenue)} icon={IndianRupee} accent="success" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        {/* Live orders preview */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-900">Live orders</h2>
            <Link href="/r/orders" className="flex items-center gap-1 text-sm font-medium text-brand-600">
              Open board <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {orders.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
            ) : orders.data && orders.data.length > 0 ? (
              orders.data.slice(0, 5).map((o) => {
                const tone =
                  o.status === OrderStatus.PLACED ? 'brand' : o.status === OrderStatus.PREPARING ? 'warning' : 'info';
                return (
                  <Link
                    key={o.id}
                    href="/r/orders"
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3.5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-900">#{o.code}</span>
                        <StatusPill
                          tone={tone}
                          size="sm"
                          label={
                            o.status === OrderStatus.PLACED
                              ? 'New'
                              : o.status === OrderStatus.PREPARING
                                ? 'Preparing'
                                : 'Ready'
                          }
                        />
                      </div>
                      <p className="truncate text-xs text-ink-600">
                        {o.studentName} · {o.hostelName} · Room {o.roomNo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-ink-900">{formatCurrency(o.itemTotal)}</p>
                      <p className="text-2xs text-ink-400">
                        {o.items.reduce((n, i) => n + i.quantity, 0)} items
                      </p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-400">
                No live orders right now.
              </div>
            )}
          </div>
        </section>

        {/* Cart status */}
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">University carts</h2>
          <div className="flex flex-col gap-2.5">
            {carts.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
              : carts.data?.map((c) => {
                  const meta = CART_STATUS_META[c.status];
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3.5 shadow-sm"
                    >
                      <span className={cn('flex h-9 w-9 items-center justify-center rounded-md bg-surface-cream text-brand-600')}>
                        <Truck className="h-4.5 w-4.5" />
                      </span>
                      <span className="flex-1 text-sm font-medium text-ink-900">{c.label}</span>
                      <StatusPill tone={meta.tone} label={meta.label} size="sm" />
                    </div>
                  );
                })}
          </div>
        </section>
      </div>
    </div>
  );
}
