'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CART_STATUS_META, CartStatus } from '@campus-bytes/types';
import { Plus, Truck } from 'lucide-react';
import { Button, Select, Skeleton, StatusPill, toast } from '@campus-bytes/ui';
import { getCarts, setCartStatus, createCart } from '@/data/admin';
import { PageHeader } from '@/components/admin/page-header';

export default function AdminCartsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-carts'], queryFn: getCarts });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-carts'] });
    qc.invalidateQueries({ queryKey: ['admin-overview'] });
  };
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CartStatus }) => setCartStatus(id, status),
    onSuccess: () => invalidate(),
  });
  const createMut = useMutation({
    mutationFn: (label: string) => createCart(label),
    onSuccess: () => { invalidate(); toast({ tone: 'success', title: 'Cart created' }); },
  });

  return (
    <div>
      <PageHeader
        title="Campus carts"
        description="Authorized university carts — a managed resource, not a login account."
        action={
          <Button
            onClick={() => {
              const n = (data?.length ?? 0) + 1;
              createMut.mutate(`Campus Cart #${String(n).padStart(2, '0')}`);
            }}
            loading={createMut.isPending}
          >
            <Plus className="h-4 w-4" /> Add cart
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((c) => {
            const meta = CART_STATUS_META[c.status];
            return (
              <div key={c.id} className="rounded-lg border border-line bg-surface p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-surface-cream text-brand-600">
                    <Truck className="h-5 w-5" />
                  </span>
                  <StatusPill tone={meta.tone} label={meta.label} />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink-900">{c.label}</h3>
                <p className="text-2xs text-ink-400">{c.currentZoneId ? `Zone: ${c.currentZoneId}` : 'No zone assigned'}</p>
                <div className="mt-4">
                  <label className="mb-1 block text-2xs font-medium uppercase tracking-wide text-ink-400">
                    Set status
                  </label>
                  <Select
                    value={c.status}
                    onChange={(e) => statusMut.mutate({ id: c.id, status: e.target.value as CartStatus })}
                  >
                    {Object.values(CartStatus).map((st) => (
                      <option key={st} value={st}>
                        {CART_STATUS_META[st].label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
