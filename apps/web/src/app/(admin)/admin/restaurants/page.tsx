'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RestaurantStatus } from '@campus-bytes/types';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Badge, Button, Skeleton, Table, THead, TBody, TR, TH, TD, ConfirmDialog, toast } from '@campus-bytes/ui';
import { getRestaurants, setRestaurantStatus, type AdminRestaurant } from '@/data/admin';
import { PageHeader } from '@/components/admin/page-header';
import { CreateRestaurantModal } from '@/components/admin/create-restaurant-modal';
import { EditRestaurantModal } from '@/components/admin/edit-restaurant-modal';
import { formatCurrency } from '@/lib/format';

const STATUS_TONE = {
  [RestaurantStatus.APPROVED]: 'success',
  [RestaurantStatus.PENDING]: 'warning',
  [RestaurantStatus.SUSPENDED]: 'error',
} as const;

export default function AdminRestaurantsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-restaurants', 'all'], queryFn: () => getRestaurants() });
  const [confirm, setConfirm] = useState<{ r: AdminRestaurant; to: RestaurantStatus } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RestaurantStatus }) => setRestaurantStatus(id, status),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
      toast({ tone: 'success', title: `${r?.name} updated` });
    },
  });

  return (
    <div>
      <PageHeader
        title="Restaurants"
        description="Manage all campus outlets. Suspension hides them from students instantly."
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New restaurant
          </Button>
        }
      />
      <CreateRestaurantModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditRestaurantModal restaurantId={editId} open={!!editId} onClose={() => setEditId(null)} />

      <div className="rounded-lg border border-line bg-surface shadow-sm">
        {isLoading ? (
          <div className="p-5"><Skeleton className="h-64 rounded-md" /></div>
        ) : (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Restaurant</TH><TH>Owner</TH><TH>Status</TH><TH>Orders today</TH><TH>Revenue</TH><TH>Rating</TH><TH></TH>
              </TR>
            </THead>
            <TBody>
              {data?.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <p className="font-medium text-ink-900">{r.name}</p>
                    <p className="text-2xs text-ink-400">{r.cuisine}</p>
                  </TD>
                  <TD className="text-ink-700">{r.ownerName}</TD>
                  <TD>
                    <Badge tone={STATUS_TONE[r.status]} size="sm" dot className="capitalize">
                      {r.status}
                    </Badge>
                    {r.isPaused && r.status === RestaurantStatus.APPROVED && (
                      <span className="ml-1 text-2xs text-ink-400">(paused)</span>
                    )}
                  </TD>
                  <TD className="tabular-nums">{r.ordersToday}</TD>
                  <TD className="tabular-nums">{formatCurrency(r.revenueToday)}</TD>
                  <TD>★ {r.avgRating.toFixed(1)}</TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditId(r.id)}>
                        Edit
                      </Button>
                      {r.status === RestaurantStatus.APPROVED ? (
                        <Button variant="ghost" size="sm" className="text-error" onClick={() => setConfirm({ r, to: RestaurantStatus.SUSPENDED })}>
                          Suspend
                        </Button>
                      ) : r.status === RestaurantStatus.SUSPENDED ? (
                        <Button variant="ghost" size="sm" onClick={() => setConfirm({ r, to: RestaurantStatus.APPROVED })}>
                          Reactivate
                        </Button>
                      ) : (
                        <span className="text-2xs text-ink-400">Awaiting review</span>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && mut.mutate({ id: confirm.r.id, status: confirm.to })}
        title={confirm?.to === RestaurantStatus.SUSPENDED ? `Suspend ${confirm?.r.name}?` : `Reactivate ${confirm?.r.name}?`}
        description={
          confirm?.to === RestaurantStatus.SUSPENDED
            ? 'The restaurant will be hidden from students immediately. In-flight orders continue.'
            : 'The restaurant becomes orderable by students again.'
        }
        confirmLabel={confirm?.to === RestaurantStatus.SUSPENDED ? 'Suspend' : 'Reactivate'}
        tone={confirm?.to === RestaurantStatus.SUSPENDED ? 'danger' : 'primary'}
      />
    </div>
  );
}
