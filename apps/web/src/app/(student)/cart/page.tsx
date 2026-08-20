'use client';

import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  QuantityStepper,
  Textarea,
  VegMark,
  buttonVariants,
  cn,
} from '@campus-bytes/ui';
import { useCartStore } from '@/stores/cart-store';
import { formatCurrency } from '@/lib/format';

const DELIVERY_FEE = 20;

export default function CartPage() {
  const router = useRouter();
  const { lines, restaurantName, restaurantId, notes } = useCartStore();
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const setNotes = useCartStore((s) => s.setNotes);
  const clear = useCartStore((s) => s.clear);
  const itemTotal = useCartStore((s) => s.itemTotal());

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col px-4 pt-4">
        <PageHead title="Your cart" />
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Add items from a campus outlet to get started."
            action={
              <Link href="/food" className={cn(buttonVariants({ size: 'md' }))}>
                Browse outlets
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const total = itemTotal + DELIVERY_FEE;

  return (
    <div className="flex flex-col gap-4 px-4 pb-40 pt-4 md:px-6">
      <PageHead title="Your cart" />

      <div className="flex items-center justify-between rounded-md bg-surface-peach px-4 py-3">
        <div>
          <p className="text-2xs font-medium uppercase tracking-wide text-brand-700">Ordering from</p>
          <p className="font-display font-semibold text-ink-900">{restaurantName}</p>
        </div>
        <Link href={`/restaurant/${restaurantId}`} className="text-sm font-medium text-brand-600">
          Add more
        </Link>
      </div>

      <div className="divide-y divide-line rounded-lg border border-line bg-surface">
        {lines.map((line) => (
          <div key={line.foodItemId} className="flex items-center gap-3 p-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-cream">
              {line.imageUrl && (
                <Image src={line.imageUrl} alt={line.name} fill sizes="56px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <VegMark isVeg={line.isVeg} />
                <p className="truncate font-medium text-ink-900">{line.name}</p>
              </div>
              <p className="mt-0.5 text-sm text-ink-600">{formatCurrency(line.price)}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <QuantityStepper
                value={line.quantity}
                min={0}
                size="sm"
                onChange={(q) => setQuantity(line.foodItemId, q)}
              />
              <button
                onClick={() => removeItem(line.foodItemId)}
                className="flex items-center gap-1 text-2xs text-ink-400 hover:text-error"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-ink-700">
          Special instructions
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Less spicy, no onions…"
          maxLength={280}
        />
      </div>

      {/* Bill summary */}
      <div className="rounded-lg border border-line bg-surface p-4">
        <h3 className="mb-3 font-display font-semibold text-ink-900">Bill details</h3>
        <dl className="flex flex-col gap-2 text-sm">
          <Row label="Item total" value={formatCurrency(itemTotal)} />
          <Row label="Delivery fee" value={formatCurrency(DELIVERY_FEE)} />
          <div className="my-1 border-t border-dashed border-line" />
          <Row label="To pay" value={formatCurrency(total)} strong />
        </dl>
      </div>

      <button onClick={clear} className="mx-auto text-xs text-ink-400 hover:text-error">
        Clear cart
      </button>

      {/* Sticky checkout CTA */}
      <div className="pb-safe fixed inset-x-0 bottom-16 z-20 mx-auto max-w-content border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:bottom-0 md:px-6">
        <Button block size="lg" onClick={() => router.push('/checkout')}>
          Continue to payment · {formatCurrency(total)}
        </Button>
      </div>
    </div>
  );
}

function PageHead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link href="/food" aria-label="Back" className="text-ink-700 hover:text-ink-900">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="font-display text-2xl font-bold text-ink-900">{title}</h1>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? 'font-semibold text-ink-900' : 'text-ink-600'}>{label}</dt>
      <dd className={strong ? 'font-display text-base font-bold text-ink-900' : 'text-ink-900'}>
        {value}
      </dd>
    </div>
  );
}
