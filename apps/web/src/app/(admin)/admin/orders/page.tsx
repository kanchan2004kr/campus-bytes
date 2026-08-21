'use client';

import { useQuery } from '@tanstack/react-query';
import { ORDER_STATUS_META } from '@campus-bytes/types';
import { AlertTriangle } from 'lucide-react';
import { Skeleton, StatusPill, Table, THead, TBody, TR, TH, TD, cn } from '@campus-bytes/ui';
import { getLiveOrders } from '@/data/admin';
import { PageHeader } from '@/components/admin/page-header';
import { formatCurrency } from '@/lib/format';

export default function AdminLiveOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-live'],
    queryFn: getLiveOrders,
    refetchInterval: 5000,
  });

  const breaches = (data ?? []).filter((o) => o.slaBreach).length;

  return (
    <div>
      <PageHeader
        title="Live orders & delivery monitor"
        description="Every active order and its assigned cart, in real time."
        action={
          breaches > 0 ? (
            <span className="flex items-center gap-1.5 rounded-md bg-error-soft px-3 py-1.5 text-sm font-semibold text-error">
              <AlertTriangle className="h-4 w-4" /> {breaches} SLA breach{breaches > 1 ? 'es' : ''}
            </span>
          ) : undefined
        }
      />

      <div className="rounded-lg border border-line bg-surface shadow-sm">
        {isLoading ? (
          <div className="p-5"><Skeleton className="h-64 rounded-md" /></div>
        ) : (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Order</TH><TH>Student</TH><TH>Restaurant</TH><TH>Deliver to</TH><TH>Cart</TH><TH>Total</TH><TH>Elapsed</TH><TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {data?.map((o) => {
                const meta = ORDER_STATUS_META[o.status];
                return (
                  <TR key={o.id} className={cn(o.slaBreach && 'bg-error-soft/40')}>
                    <TD className="font-semibold">#{o.code}</TD>
                    <TD className="text-ink-700">{o.studentName}</TD>
                    <TD className="text-ink-700">{o.restaurantName}</TD>
                    <TD className="text-ink-600">
                      {(o.deliveryLocationName ?? o.hostelName)}
                      {(o.deliveryType ?? 'hostel') === 'hostel' && o.roomNo && o.roomNo !== '—'
                        ? ` · Room ${o.roomNo}`
                        : ''}
                    </TD>
                    <TD className="text-ink-600">{o.cartLabel ?? '—'}</TD>
                    <TD className="tabular-nums">{formatCurrency(o.grandTotal)}</TD>
                    <TD>
                      <span className={cn('tabular-nums', o.slaBreach ? 'font-semibold text-error' : 'text-ink-600')}>
                        {o.elapsedMin}m
                      </span>
                    </TD>
                    <TD><StatusPill tone={meta.tone} label={meta.label} size="sm" /></TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  );
}
