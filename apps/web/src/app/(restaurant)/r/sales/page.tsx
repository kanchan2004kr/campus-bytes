'use client';

import { useQuery } from '@tanstack/react-query';
import { IndianRupee, Receipt, TrendingUp, CheckCircle2 } from 'lucide-react';
import { StatCard, Skeleton } from '@campus-bytes/ui';
import { getSales } from '@/data/restaurant';
import { BarChart } from '@/components/dashboard/bar-chart';
import { formatCurrency } from '@/lib/format';

export default function SalesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['r-sales'], queryFn: getSales });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Sales</h1>
        <p className="text-sm text-ink-600">Today’s performance and demand insight.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : (
          <>
            <StatCard label="Today's revenue" value={formatCurrency(data.todaysRevenue)} icon={IndianRupee} accent="success" trend={{ value: '12%', direction: 'up' }} />
            <StatCard label="Orders" value={String(data.todaysOrders)} icon={Receipt} accent="brand" />
            <StatCard label="Avg order value" value={formatCurrency(data.avgOrderValue)} icon={TrendingUp} accent="info" />
            <StatCard label="Completion rate" value={`${data.completionRate}%`} icon={CheckCircle2} accent="success" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-surface p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-1 font-display text-lg font-semibold text-ink-900">Orders by hour</h2>
          <p className="mb-6 text-sm text-ink-600">Identify your peak windows to staff the kitchen.</p>
          {isLoading || !data ? (
            <Skeleton className="h-40 rounded-md" />
          ) : (
            <BarChart data={data.ordersByHour} height={180} />
          )}
        </section>

        <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Top sellers</h2>
          {isLoading || !data ? (
            <Skeleton className="h-40 rounded-md" />
          ) : (
            <ol className="flex flex-col gap-3">
              {data.topItems.map((item, i) => (
                <li key={item.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-2xs font-bold text-brand-700">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-ink-900">{item.name}</span>
                  <span className="text-right">
                    <span className="block text-sm font-semibold text-ink-900">{item.qty} sold</span>
                    <span className="block text-2xs text-ink-400">{formatCurrency(item.revenue)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
