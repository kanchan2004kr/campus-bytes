'use client';

import { ArrowLeft, MapPin, ShieldCheck, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, EmptyState, toast } from '@campus-bytes/ui';
import { getStudentProfile } from '@/data/client';
import { useCartStore } from '@/stores/cart-store';
import { formatCurrency } from '@/lib/format';
import { startCheckout } from '@/lib/payment';

const DELIVERY_FEE = 20;

const TYPE_LABEL: Record<string, string> = {
  hostel: 'Hostel',
  gate: 'Gate',
  university: 'University Location',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, restaurantName, restaurantId, notes } = useCartStore();
  const itemTotal = useCartStore((s) => s.itemTotal());
  const [submitting, setSubmitting] = useState(false);
  const { data: profile } = useQuery({ queryKey: ['student-profile'], queryFn: getStudentProfile });

  if (lines.length === 0) {
    return (
      <div className="p-6">
        <EmptyState title="Nothing to check out" description="Your cart is empty." />
      </div>
    );
  }

  const total = itemTotal + DELIVERY_FEE;
  const loc = profile?.deliveryLocation ?? null;

  const handlePay = async () => {
    if (!loc) {
      toast({
        tone: 'error',
        title: 'Delivery location required',
        description: 'Please select your delivery location before placing your order.',
      });
      router.push('/delivery-address?next=/checkout');
      return;
    }
    setSubmitting(true);
    try {
      const result = await startCheckout({
        restaurantId: restaurantId!,
        items: lines.map((l) => ({ foodItemId: l.foodItemId, quantity: l.quantity })),
        notes,
        amount: total,
      });
      if (result.status === 'not_implemented') {
        toast({
          tone: 'info',
          title: 'Online payment activates soon',
          description: 'Razorpay checkout connects when the backend goes live (Phase 10).',
          duration: 5000,
        });
        return;
      }
      if (result.status === 'failed') {
        toast({ tone: 'error', title: 'Payment failed', description: result.reason });
        return;
      }
      // Real flow (Phase 10): only navigate once the webhook-verified order exists.
      router.push(`/orders/${result.orderCode}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4 pb-40 pt-4 md:px-6">
      <div className="flex items-center gap-3">
        <Link href="/cart" aria-label="Back" className="text-ink-700 hover:text-ink-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-ink-900">Checkout</h1>
      </div>

      {/* Delivery address — read-only card sourced from the saved profile
          location. Editing happens in the dedicated /delivery-address flow. */}
      <section className="rounded-lg border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display font-semibold text-ink-900">
            <MapPin className="h-4 w-4 text-brand-600" /> Delivery Address
          </h2>
          <Link
            href="/delivery-address?next=/checkout"
            className="text-sm font-medium text-brand-600"
          >
            {loc ? 'Change Address' : 'Add Delivery Address'}
          </Link>
        </div>
        {loc ? (
          <div className="mt-2">
            <p className="text-sm font-semibold text-ink-900">
              {loc.name}
              {loc.type === 'hostel' && loc.roomNo ? `, Room ${loc.roomNo}` : ''}
            </p>
            <p className="text-xs text-ink-400">
              {TYPE_LABEL[loc.type] ?? loc.type} · NIMS University Campus · University cart delivery
            </p>
            {loc.instructions && (
              <p className="mt-1 text-xs italic text-ink-600">“{loc.instructions}”</p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-error">No delivery address added.</p>
        )}
      </section>

      {/* Order summary */}
      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="mb-3 font-display font-semibold text-ink-900">
          Order summary · <span className="text-ink-600">{restaurantName}</span>
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          {lines.map((l) => (
            <li key={l.foodItemId} className="flex justify-between">
              <span className="text-ink-700">
                {l.quantity} × {l.name}
              </span>
              <span className="tabular-nums text-ink-900">{formatCurrency(l.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1.5 border-t border-dashed border-line pt-3 text-sm">
          <div className="flex justify-between text-ink-600">
            <span>Item total</span>
            <span>{formatCurrency(itemTotal)}</span>
          </div>
          <div className="flex justify-between text-ink-600">
            <span>Delivery fee</span>
            <span>{formatCurrency(DELIVERY_FEE)}</span>
          </div>
          <div className="flex justify-between pt-1 font-semibold text-ink-900">
            <span>To pay</span>
            <span className="font-display text-base">{formatCurrency(total)}</span>
          </div>
        </div>
      </section>

      {/* Payment method */}
      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="mb-3 font-display font-semibold text-ink-900">Payment method</h2>
        <div className="flex items-center gap-3 rounded-md border border-brand-200 bg-brand-50 p-3">
          <Smartphone className="h-5 w-5 text-brand-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-900">UPI · Card · Wallet</p>
            <p className="text-xs text-ink-600">Secure online payment via Razorpay</p>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-2xs text-ink-400">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Online payment only. Your order is confirmed after payment is verified.
        </p>
      </section>

      <div className="pb-safe fixed inset-x-0 bottom-16 z-20 mx-auto max-w-content border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:bottom-0 md:px-6">
        <Button block size="lg" loading={submitting} onClick={handlePay}>
          Pay {formatCurrency(total)}
        </Button>
      </div>
    </div>
  );
}
