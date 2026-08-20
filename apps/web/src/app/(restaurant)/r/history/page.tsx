'use client';

import { useQuery } from '@tanstack/react-query';
import { ORDER_STATUS_META } from '@campus-bytes/types';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { EmptyState, Skeleton, StatusPill, Table, THead, TBody, TR, TH, TD } from '@campus-bytes/ui';
import { getOrderHistory } from '@/data/restaurant';
import { formatCurrency, formatRelative } from '@/lib/format';

export default function OrderHistoryPage() {
  const { data, isLoading } = useQuery({ queryKey: ['r-history'], queryFn: getOrderHistory });
  const [q, setQ] = useState('');

  const filtered = (data ?? []).filter(
    (o) =>
      o.code.toLowerCase().includes(q.toLowerCase()) ||
      o.studentName.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Order history</h1>
          <p className="text-sm text-ink-600">All completed and rejected orders.</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-line-strong bg-surface px-3">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search #code or student"
            className="h-10 w-56 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface shadow-sm">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-48 rounded-md" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No orders found" description="Try a different search." />
        ) : (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Order</TH>
                <TH>Student</TH>
                <TH>Items</TH>
                <TH>Total</TH>
                <TH>Cart</TH>
                <TH>Status</TH>
                <TH>When</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((o) => {
                const meta = ORDER_STATUS_META[o.status];
                return (
                  <TR key={o.id}>
                    <TD className="font-semibold">#{o.code}</TD>
                    <TD className="text-ink-700">
                      {o.studentName}
                      <span className="block text-2xs text-ink-400">Room {o.roomNo}</span>
                    </TD>
                    <TD className="text-ink-600">
                      {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </TD>
                    <TD className="font-medium tabular-nums">{formatCurrency(o.itemTotal)}</TD>
                    <TD className="text-ink-600">{o.cartLabel ?? '—'}</TD>
                    <TD>
                      <StatusPill tone={meta.tone} label={meta.label} size="sm" />
                    </TD>
                    <TD className="whitespace-nowrap text-2xs text-ink-400">{formatRelative(o.placedAt)}</TD>
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
