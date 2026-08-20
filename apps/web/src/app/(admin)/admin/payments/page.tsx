'use client';

import { useQuery } from '@tanstack/react-query';
import { IndianRupee, RotateCcw, XCircle } from 'lucide-react';
import { Badge, StatCard, Skeleton, Table, THead, TBody, TR, TH, TD } from '@campus-bytes/ui';
import { getPayments } from '@/data/admin';
import { PageHeader } from '@/components/admin/page-header';
import { formatCurrency, formatRelative } from '@/lib/format';

const STATUS_TONE = { captured: 'success', refunded: 'warning', failed: 'error' } as const;

export default function AdminPaymentsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-payments'], queryFn: getPayments });

  const captured = (data ?? []).filter((p) => p.status === 'captured');
  const refunded = (data ?? []).filter((p) => p.status === 'refunded');
  const net = captured.reduce((s, p) => s + p.amount, 0) - refunded.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader title="Payments" description="Online transactions and refunds — Razorpay. No cash reconciliation." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : (
          <>
            <StatCard label="Net settled" value={formatCurrency(net)} icon={IndianRupee} accent="success" />
            <StatCard label="Refunds" value={String(refunded.length)} icon={RotateCcw} accent="warning" />
            <StatCard label="Failed" value={String((data ?? []).filter((p) => p.status === 'failed').length)} icon={XCircle} accent="error" />
          </>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-line bg-surface shadow-sm">
        {isLoading ? (
          <div className="p-5"><Skeleton className="h-64 rounded-md" /></div>
        ) : (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Order</TH><TH>Amount</TH><TH>Method</TH><TH>Provider</TH><TH>Status</TH><TH>When</TH>
              </TR>
            </THead>
            <TBody>
              {data?.map((p) => (
                <TR key={p.id}>
                  <TD className="font-semibold">#{p.orderCode}</TD>
                  <TD className="tabular-nums">{formatCurrency(p.amount)}</TD>
                  <TD className="text-ink-700">{p.method}</TD>
                  <TD className="text-ink-600">{p.provider}</TD>
                  <TD><Badge tone={STATUS_TONE[p.status]} size="sm" dot className="capitalize">{p.status}</Badge></TD>
                  <TD className="whitespace-nowrap text-2xs text-ink-400">{formatRelative(p.at)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  );
}
