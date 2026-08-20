'use client';

import { useQuery } from '@tanstack/react-query';
import { IndianRupee, ShoppingBag, TrendingUp, Timer } from 'lucide-react';
import { StatCard, Skeleton, Table, THead, TBody, TR, TH, TD } from '@campus-bytes/ui';
import { getAdminOverview, getRestaurantPerformance } from '@/data/admin';
import { PageHeader } from '@/components/admin/page-header';
import { BarChart } from '@/components/dashboard/bar-chart';
import { formatCurrency } from '@/lib/format';

const ZONE_DEMAND = [
  { label: 'Larimar', value: 320 },
  { label: 'Vista', value: 210 },
  { label: 'LG', value: 280 },
  { label: 'LP', value: 150 },
  { label: 'Library', value: 90 },
];

export default function AdminAnalyticsPage() {
  const overview = useQuery({ queryKey: ['admin-overview'], queryFn: getAdminOverview });
  const perf = useQuery({ queryKey: ['admin-perf'], queryFn: getRestaurantPerformance });
  const o = overview.data;
  const aov = o && o.todaysOrders ? Math.round(o.todaysRevenue / o.todaysOrders) : 0;

  return (
    <div>
      <PageHeader title="Analytics" description="Operational insight across the campus." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {overview.isLoading || !o ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : (
          <>
            <StatCard label="Revenue (today)" value={formatCurrency(o.todaysRevenue)} icon={IndianRupee} accent="success" />
            <StatCard label="Orders (today)" value={String(o.todaysOrders)} icon={ShoppingBag} accent="brand" />
            <StatCard label="Avg order value" value={formatCurrency(aov)} icon={TrendingUp} accent="info" />
            <StatCard label="Avg delivery" value={`${o.avgDeliveryMin} min`} icon={Timer} accent="warning" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-1 font-display text-lg font-semibold text-ink-900">Orders by hour</h2>
          <p className="mb-6 text-sm text-ink-600">When the campus orders most.</p>
          {overview.isLoading || !o ? <Skeleton className="h-44 rounded-md" /> : <BarChart data={o.peakHours} height={190} />}
        </section>

        <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-1 font-display text-lg font-semibold text-ink-900">Demand by zone</h2>
          <p className="mb-6 text-sm text-ink-600">Weekly orders per hostel / pickup point.</p>
          <BarChart data={ZONE_DEMAND} height={190} valueFormat={(v) => `${v}`} />
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">Top restaurants</h2>
        </div>
        {perf.isLoading ? (
          <div className="p-5"><Skeleton className="h-40 rounded-md" /></div>
        ) : (
          <Table>
            <THead>
              <TR className="hover:bg-transparent"><TH>#</TH><TH>Restaurant</TH><TH>Orders</TH><TH>Revenue</TH><TH>Rating</TH></TR>
            </THead>
            <TBody>
              {perf.data?.map((r, i) => (
                <TR key={r.id}>
                  <TD className="text-ink-400">{i + 1}</TD>
                  <TD className="font-medium">{r.name}</TD>
                  <TD className="tabular-nums">{r.ordersToday}</TD>
                  <TD className="tabular-nums">{formatCurrency(r.revenueToday)}</TD>
                  <TD>★ {r.avgRating.toFixed(1)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>
    </div>
  );
}
