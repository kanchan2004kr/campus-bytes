'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderStatus } from '@campus-bytes/types';
import { Check, Clock, MapPin, StickyNote, Truck, X } from 'lucide-react';
import { useState } from 'react';
import { Button, Modal, Textarea, VegMark, cn, toast } from '@campus-bytes/ui';
import {
  acceptOrder,
  rejectOrder,
  markReady,
  markDelivered,
  type RestaurantOrder,
} from '@/data/restaurant';
import { formatCurrency, formatRelative } from '@/lib/format';
import { CartHandoverModal } from './cart-handover-modal';

const PREP_PRESETS = [10, 15, 20, 25, 30];
const REJECT_REASONS = ['Item out of stock', 'Kitchen too busy', 'Closing soon', 'Cannot fulfil special request'];

export function OrderCard({ order }: { order: RestaurantOrder }) {
  const qc = useQueryClient();
  const [showAccept, setShowAccept] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showHandover, setShowHandover] = useState(false);
  const [prep, setPrep] = useState(15);
  const [reason, setReason] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['r-orders'] });
    qc.invalidateQueries({ queryKey: ['r-summary'] });
    qc.invalidateQueries({ queryKey: ['r-carts'] });
  };

  const accept = useMutation({
    mutationFn: () => acceptOrder(order.id, prep),
    onSuccess: () => {
      invalidate();
      setShowAccept(false);
      toast({ tone: 'success', title: `Accepted #${order.code}`, description: `Prep time ${prep} min` });
    },
    onError: (e) => toast({ tone: 'error', title: 'Could not accept', description: String(e) }),
  });

  const reject = useMutation({
    mutationFn: () => rejectOrder(order.id, reason),
    onSuccess: () => {
      invalidate();
      setShowReject(false);
      toast({ tone: 'warning', title: `Rejected #${order.code}`, description: 'Student auto-refunded.' });
    },
  });

  const ready = useMutation({
    mutationFn: () => markReady(order.id),
    onSuccess: () => {
      invalidate();
      toast({ tone: 'info', title: `#${order.code} is ready`, description: 'Assign a cart to hand over.' });
    },
  });

  const delivered = useMutation({
    mutationFn: () => markDelivered(order.id),
    onSuccess: () => {
      invalidate();
      toast({ tone: 'success', title: `#${order.code} delivered`, description: 'Cart is free again.' });
    },
  });

  const totalItems = order.items.reduce((n, i) => n + i.quantity, 0);
  const isNew = order.status === OrderStatus.PLACED;

  return (
    <div
      className={cn(
        'rounded-lg border bg-surface shadow-sm',
        isNew ? 'border-brand-300 ring-1 ring-brand-100' : 'border-line',
      )}
    >
      {/* Header */}
      <div className={cn('flex items-start justify-between gap-2 rounded-t-lg px-4 py-3', isNew && 'bg-brand-50')}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-bold text-ink-900">#{order.code}</span>
            {isNew && (
              <span className="rounded-pill bg-brand-600 px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-white">
                New
              </span>
            )}
          </div>
          <p className="text-xs text-ink-500">{formatRelative(order.placedAt)}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-ink-900">{formatCurrency(order.itemTotal)}</p>
          <p className="text-2xs text-ink-400">{totalItems} items</p>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3 px-4 py-3">
        {(() => {
          const typeLabel: Record<string, string> = {
            hostel: 'Hostel',
            gate: 'Gate',
            university: 'University',
          };
          const locName = order.deliveryLocationName ?? order.hostelName;
          const roomNo = order.deliveryRoomNo ?? order.roomNo;
          const isHostel = (order.deliveryType ?? 'hostel') === 'hostel';
          return (
            <div className="rounded-md border border-line bg-surface-cream px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-ink-900">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                {order.studentName}
                {order.studentId2 ? <span className="text-ink-400">· {order.studentId2}</span> : null}
              </div>
              <p className="mt-1 text-ink-700">
                {order.deliveryType ? `${typeLabel[order.deliveryType] ?? order.deliveryType}: ` : ''}
                <span className="font-medium text-ink-900">{locName}</span>
                {isHostel && roomNo ? ` · Room ${roomNo}` : ''}
              </p>
              {order.deliveryInstructions ? (
                <p className="mt-0.5 italic text-ink-600">“{order.deliveryInstructions}”</p>
              ) : null}
            </div>
          );
        })()}

        <ul className="space-y-1.5">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <VegMark isVeg={it.isVeg} />
              <span className="font-medium text-ink-900">{it.quantity}×</span>
              <span className="text-ink-700">{it.name}</span>
            </li>
          ))}
        </ul>

        {order.notes && (
          <div className="flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-xs text-warning-fg">
            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{order.notes}</span>
          </div>
        )}

        {order.prepTimeMin && order.status === OrderStatus.PREPARING && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
            <Clock className="h-3.5 w-3.5" /> Prep time · {order.prepTimeMin} min
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-line px-4 py-3">
        {order.status === OrderStatus.PLACED && (
          <>
            <Button variant="outline" size="sm" className="flex-1 text-error" onClick={() => setShowReject(true)}>
              <X className="h-4 w-4" /> Reject
            </Button>
            <Button size="sm" className="flex-1" onClick={() => setShowAccept(true)}>
              <Check className="h-4 w-4" /> Accept
            </Button>
          </>
        )}
        {order.status === OrderStatus.PREPARING && (
          <Button size="sm" block loading={ready.isPending} onClick={() => ready.mutate()}>
            <Check className="h-4 w-4" /> Mark ready
          </Button>
        )}
        {order.status === OrderStatus.READY && (
          <Button size="sm" block onClick={() => setShowHandover(true)}>
            <Truck className="h-4 w-4" /> Hand over to cart
          </Button>
        )}
        {order.status === OrderStatus.OUT_FOR_DELIVERY && (
          <div className="flex w-full items-center gap-2">
            <span className="flex flex-1 items-center gap-1.5 text-xs font-medium text-brand-700">
              <Truck className="h-4 w-4" /> {order.cartLabel} en route
            </span>
            <Button variant="outline" size="sm" loading={delivered.isPending} onClick={() => delivered.mutate()}>
              <Check className="h-4 w-4" /> Delivered
            </Button>
          </div>
        )}
      </div>

      {/* Accept modal — prep time */}
      <Modal
        open={showAccept}
        onClose={() => setShowAccept(false)}
        title={`Accept order #${order.code}`}
        variant="sheet"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAccept(false)}>Cancel</Button>
            <Button loading={accept.isPending} onClick={() => accept.mutate()}>
              Accept · {prep} min
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-600">Set the preparation time shown to the student.</p>
        <div className="grid grid-cols-5 gap-2">
          {PREP_PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => setPrep(m)}
              className={cn(
                'rounded-md border py-2.5 text-sm font-semibold transition-colors',
                prep === m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink-700 hover:bg-surface-cream',
              )}
            >
              {m}m
            </button>
          ))}
        </div>
      </Modal>

      {/* Reject modal — reason required */}
      <Modal
        open={showReject}
        onClose={() => setShowReject(false)}
        title={`Reject order #${order.code}`}
        variant="sheet"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowReject(false)}>Cancel</Button>
            <Button variant="danger" disabled={reason.trim().length < 3} loading={reject.isPending} onClick={() => reject.mutate()}>
              Reject & refund
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-600">
          A reason is required. The student is automatically refunded.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {REJECT_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={cn(
                'rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors',
                reason === r ? 'border-error bg-error-soft text-error' : 'border-line text-ink-600 hover:bg-surface-cream',
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Add a reason for the student…"
          maxLength={200}
        />
      </Modal>

      <CartHandoverModal
        open={showHandover}
        onClose={() => setShowHandover(false)}
        order={order}
        onAssigned={invalidate}
      />
    </div>
  );
}
