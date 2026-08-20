'use client';

import { useQuery } from '@tanstack/react-query';
import { ORDER_STATUS_META, type OrderStatus } from '@campus-bytes/types';
import {
  ShoppingBag,
  IndianRupee,
  Store,
  Truck,
  Timer,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { StatCard, StatusPill, Skeleton, Table, THead, TBody, TR, TH, TD, cn } from '@campus-bytes/ui';
import { getAdminOverview, getRestaurantPerformance, getLiveOrders } from '@/data/admin';
import { PageHeader } from '@/components/admin/page-header';
import { BarChart } from '@/components/dashboard/bar-chart';
import { formatCurrency } from '@/lib/format';

const TONE_BG: Record<string, string> = {
  info: 'bg-info', warning: 'bg-warning', success: 'bg-success',
  error: 'bg-error', brand: 'bg-brand-600', muted: 'bg-ink-400',
};

export default function AdminDashboard() {
  const overview = useQuery({ queryKey: ['admin-overview'], queryFn: getAdminOverview });
  const perf = useQuery({ queryKey: ['admin-perf'], queryFn: getRestaurantPerformance });
  const live = useQuery({ queryKey: ['admin-live'], queryFn: getLiveOrders });
  const o = overview.data;

  const dist = (o?.statusDist ?? []).filter((d) => d.count > 0);
  const distTotal = dist.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <div>
      <PageHeader title="Campus overview" description="Live operations across NIMS University." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {overview.isLoading || !o ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : (
          <>
            <StatCard label="Today's orders" value={String(o.todaysOrders)} icon={ShoppingBag} accent="brand" trend={{ value: '8%', direction: 'up' }} />
            <StatCard label="Today's revenue" value={formatCurrency(o.todaysRevenue)} icon={IndianRupee} accent="success" trend={{ value: '12%', direction: 'up' }} />
            <StatCard label="Active restaurants" value={String(o.activeRestaurants)} icon={Store} accent="info" />
            <StatCard label="Active carts" value={String(o.activeCarts)} icon={Truck} accent="warning" />
            <StatCard label="Avg delivery" value={`${o.avgDeliveryMin} min`} icon={Timer} accent="neutral" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        {/* Peak hours */}
        <section className="rounded-lg border border-line bg-surface p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-1 font-display text-lg font-semibold text-ink-900">Orders by hour</h2>
          <p className="mb-6 text-sm text-ink-600">Campus-wide demand — identify peak windows.</p>
          {overview.isLoading || !o ? <Skeleton className="h-44 rounded-md" /> : <BarChart data={o.peakHours} height={190} />}
        </section>

        {/* Order status distribution */}
        <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Live order status</h2>
          {overview.isLoading || !o ? (
            <Skeleton className="h-44 rounded-md" />
          ) : dist.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">No live orders.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex h-2.5 overflow-hidden rounded-pill">
                {dist.map((d) => {
                  const meta = ORDER_STATUS_META[d.status as OrderStatus];
                  return (
                    <div
                      key={d.status}
                      className={cn(TONE_BG[meta.tone])}
                      style={{ width: `${(d.count / distTotal) * 100}%` }}
                    />
                  );
                })}
              </div>
              <ul className="flex flex-col gap-2">
                {dist.map((d) => {
                  const meta = ORDER_STATUS_META[d.status as OrderStatus];
                  return (
                    <li key={d.status} className="flex items-center gap-2 text-sm">
                      <span className={cn('h-2.5 w-2.5 rounded-full', TONE_BG[meta.tone])} />
                      <span className="flex-1 text-ink-700">{meta.label}</span>
                      <span className="font-semibold tabular-nums text-ink-900">{d.count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        {/* Restaurant performance */}
        <section className="rounded-lg border border-line bg-surface shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-ink-900">Restaurant performance</h2>
            <Link href="/admin/restaurants" className="flex items-center gap-1 text-sm font-medium text-brand-600">
              All restaurants <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {perf.isLoading ? (
            <div className="p-5"><Skeleton className="h-40 rounded-md" /></div>
          ) : (
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Restaurant</TH><TH>Orders</TH><TH>Revenue</TH><TH>Rating</TH>
                </TR>
              </THead>
              <TBody>
                {perf.data?.map((r) => (
                  <TR key={r.id}>
                    <TD className="font-medium">{r.name}</TD>
                    <TD className="tabular-nums">{r.ordersToday}</TD>
                    <TD className="tabular-nums">{formatCurrency(r.revenueToday)}</TD>
                    <TD>
                      <span className="inline-flex items-center gap-1 text-ink-700">★ {r.avgRating.toFixed(1)}</span>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </section>

        {/* Live orders */}
        <section className="rounded-lg border border-line bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-ink-900">Live orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-brand-600">Monitor</Link>
          </div>
          <ul className="divide-y divide-line">
            {live.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <li key={i} className="p-4"><Skeleton className="h-8 rounded-md" /></li>)
              : live.data?.slice(0, 4).map((ord) => {
                  const meta = ORDER_STATUS_META[ord.status];
                  return (
                    <li key={ord.id} className="flex items-center justify-between gap-2 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900">#{ord.code}</p>
                        <p className="truncate text-2xs text-ink-400">{ord.restaurantName} → {ord.hostelName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusPill tone={meta.tone} label={meta.label} size="sm" />
                        {ord.slaBreach && <span className="text-2xs font-semibold text-error">SLA · {ord.elapsedMin}m</span>}
                      </div>
                    </li>
                  );
                })}
          </ul>
        </section>
      </div>
    </div>
  );
}
