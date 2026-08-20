'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RestaurantStatus } from '@campus-bytes/types';
import { Check, Store, X } from 'lucide-react';
import { useState } from 'react';
import { Button, EmptyState, Modal, Skeleton, Textarea, toast } from '@campus-bytes/ui';
import { getRestaurants, approveRestaurant, rejectRestaurant, type AdminRestaurant } from '@/data/admin';
import { PageHeader } from '@/components/admin/page-header';
import { formatRelative } from '@/lib/format';

export default function ApprovalsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-restaurants', 'pending'],
    queryFn: () => getRestaurants(RestaurantStatus.PENDING),
  });
  const [rejecting, setRejecting] = useState<AdminRestaurant | null>(null);
  const [reason, setReason] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
    qc.invalidateQueries({ queryKey: ['admin-overview'] });
  };

  const approve = useMutation({
    mutationFn: approveRestaurant,
    onSuccess: (r) => { invalidate(); toast({ tone: 'success', title: `${r?.name} approved`, description: 'Now visible to students.' }); },
  });
  const reject = useMutation({
    mutationFn: () => rejectRestaurant(rejecting!.id, reason),
    onSuccess: () => { invalidate(); setRejecting(null); setReason(''); toast({ tone: 'warning', title: 'Application rejected' }); },
  });

  return (
    <div>
      <PageHeader title="Restaurant approvals" description="Review and decide on new vendor applications." />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((r) => (
            <div key={r.id} className="rounded-lg border border-line bg-surface p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-surface-peach text-brand-700">
                  <Store className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold text-ink-900">{r.name}</h3>
                  <p className="text-sm text-ink-600">{r.cuisine}</p>
                </div>
                <span className="rounded-pill bg-warning-soft px-2.5 py-1 text-2xs font-semibold text-warning-fg">
                  Pending
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-2xs uppercase tracking-wide text-ink-400">Owner</dt><dd className="text-ink-900">{r.ownerName}</dd></div>
                <div><dt className="text-2xs uppercase tracking-wide text-ink-400">Applied</dt><dd className="text-ink-900">{formatRelative(r.appliedAt)}</dd></div>
                <div className="col-span-2"><dt className="text-2xs uppercase tracking-wide text-ink-400">Contact</dt><dd className="text-ink-900">{r.ownerEmail}</dd></div>
              </dl>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1 text-error" onClick={() => setRejecting(r)}>
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button className="flex-1" loading={approve.isPending && approve.variables === r.id} onClick={() => approve.mutate(r.id)}>
                  <Check className="h-4 w-4" /> Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Store} title="No pending applications" description="New vendor applications will appear here for review." />
      )}

      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title={`Reject ${rejecting?.name}?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="danger" disabled={reason.trim().length < 3} loading={reject.isPending} onClick={() => reject.mutate()}>
              Reject application
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-600">Provide a reason. The applicant will be notified.</p>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection…" maxLength={200} />
      </Modal>
    </div>
  );
}
