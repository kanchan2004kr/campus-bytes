'use client';

import { useEffect, useRef } from 'react';
import { Check, MapPin } from 'lucide-react';
import { Button } from '@campus-bytes/ui';
import { formatCurrency } from '@/lib/format';
import type { DeliveryLocation } from '@/data/client';

export interface SuccessOrder {
  code: string;
  restaurantName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  location: DeliveryLocation | null;
}

const TYPE_LABEL: Record<string, string> = {
  hostel: 'Hostel',
  gate: 'Gate',
  university: 'University Location',
};

/**
 * Full-screen order-success experience. Rendered ONLY after the backend confirms
 * the order was created. Plays a short pleasant confirmation chime once (triggered
 * from the user's place-order gesture, so mobile autoplay allows it).
 */
export function OrderSuccess({ order, onTrack }: { order: SuccessOrder; onTrack: () => void }) {
  const played = useRef(false);

  useEffect(() => {
    if (played.current) return;
    played.current = true;
    playSuccessChime();
  }, []);

  const loc = order.location;
  const addrLine =
    loc && loc.type === 'hostel' && loc.roomNo ? `Room ${loc.roomNo}, ${loc.name}` : loc?.name ?? '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-sm overflow-hidden rounded-2xl bg-surface shadow-xl">
        <div className="flex flex-col items-center px-6 pt-8 text-center">
          {/* Animated green check */}
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-success/20" />
            <span className="animate-scale-in flex h-20 w-20 items-center justify-center rounded-full bg-success text-white shadow-lg">
              <Check className="h-10 w-10" strokeWidth={3} />
            </span>
          </div>
          <h2 className="mt-5 font-display text-xl font-bold text-ink-900">Order Placed Successfully!</h2>
          <p className="mt-1 font-display text-2xl font-bold text-brand-600">#{order.code}</p>
          <p className="mt-1 text-sm text-ink-600">Your order has been sent to the restaurant.</p>
        </div>

        {/* Delivery address */}
        <div className="mx-6 mt-5 rounded-lg border border-line bg-surface-cream p-3">
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-400">
            <MapPin className="h-3.5 w-3.5 text-brand-600" /> Delivering to
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink-900">{addrLine}</p>
          <p className="text-xs text-ink-500">
            {loc ? `${TYPE_LABEL[loc.type] ?? loc.type} · NIMS University Campus` : 'NIMS University Campus'}
          </p>
          {loc?.instructions && <p className="mt-0.5 text-xs italic text-ink-500">“{loc.instructions}”</p>}
        </div>

        {/* Order summary */}
        <div className="mx-6 mt-3 rounded-lg border border-line p-3">
          <p className="font-display text-sm font-semibold text-ink-900">{order.restaurantName}</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between text-ink-700">
                <span>
                  {it.name} <span className="text-ink-400">× {it.quantity}</span>
                </span>
                <span className="tabular-nums">{formatCurrency(it.price * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-dashed border-line pt-2 text-sm font-semibold text-ink-900">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div className="p-6 pt-4">
          <Button block size="lg" onClick={onTrack}>
            Track your order
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Short, pleasant two-note confirmation chime via WebAudio. Silent fallback. */
function playSuccessChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [660, 990]; // rising major third-ish, gentle
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.start(start);
      osc.stop(start + 0.3);
    });
    setTimeout(() => void ctx.close(), 800);
  } catch {
    /* audio unavailable — silent, non-blocking */
  }
}
