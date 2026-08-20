'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CART_STATUS_META, CartStatus } from '@campus-bytes/types';
import { Truck } from 'lucide-react';
import { useState } from 'react';
import { Button, Modal, StatusPill, cn, toast } from '@campus-bytes/ui';
import { assignCart, getCarts, type RestaurantOrder } from '@/data/restaurant';

export function CartHandoverModal({
  open,
  onClose,
  order,
  onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  order: RestaurantOrder;
  onAssigned: () => void;
}) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const carts = useQuery({ queryKey: ['r-carts'], queryFn: getCarts, enabled: open });

  const assign = useMutation({
    mutationFn: (cartId: string) => assignCart(order.id, cartId),
    onSuccess: (o) => {
      onAssigned();
      qc.invalidateQueries({ queryKey: ['r-carts'] });
      onClose();
      setSelected(null);
      toast({ tone: 'success', title: `Handed to ${o.cartLabel}`, description: `#${order.code} is out for delivery.` });
    },
    onError: (e) => toast({ tone: 'error', title: 'Handover failed', description: String(e) }),
  });

  const available = carts.data?.filter((c) => c.status === CartStatus.AVAILABLE) ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Hand over #${order.code}`}
      variant="sheet"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!selected}
            loading={assign.isPending}
            onClick={() => selected && assign.mutate(selected)}
          >
            Confirm handover
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink-600">
        Delivering to {order.hostelName} · Room {order.roomNo}. Select an available university cart.
      </p>

      {available.length === 0 ? (
        <div className="rounded-md border border-dashed border-warning bg-warning-soft p-4 text-center text-sm text-warning-fg">
          No carts available right now. The order stays ready and Admin is alerted — try again shortly.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {carts.data?.map((c) => {
            const meta = CART_STATUS_META[c.status];
            const isAvailable = c.status === CartStatus.AVAILABLE;
            const active = selected === c.id;
            return (
              <button
                key={c.id}
                disabled={!isAvailable}
                onClick={() => setSelected(c.id)}
                className={cn(
                  'flex items-center gap-3 rounded-md border p-3 text-left transition-colors',
                  active ? 'border-brand-600 bg-brand-50' : 'border-line hover:bg-surface-cream',
                  !isAvailable && 'cursor-not-allowed opacity-60 hover:bg-surface',
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-cream text-brand-600">
                  <Truck className="h-4.5 w-4.5" />
                </span>
                <span className="flex-1 text-sm font-medium text-ink-900">{c.label}</span>
                <StatusPill tone={meta.tone} label={meta.label} size="sm" />
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
