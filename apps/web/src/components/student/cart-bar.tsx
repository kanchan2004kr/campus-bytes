'use client';

import { ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { buttonVariants, cn } from '@campus-bytes/ui';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';
import { formatCurrency } from '@/lib/format';

/** Sticky summary bar shown above the bottom nav whenever the cart has items. */
export function CartBar() {
  const count = useCartStore((s) => s.itemCount());
  const total = useCartStore((s) => s.itemTotal());

  if (count === 0) return null;

  return (
    <div className="pb-safe fixed inset-x-0 bottom-16 z-20 mx-auto max-w-content px-4 md:bottom-4 md:px-6">
      <Link
        href="/cart"
        className={cn(
          buttonVariants({ size: 'lg', block: true }),
          'justify-between px-5 shadow-lg animate-slide-up',
        )}
      >
        <span className="flex items-center gap-2.5">
          <span className="relative flex h-6 w-6 items-center justify-center">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="font-semibold">
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        </span>
        <span className="flex items-center gap-2 font-semibold">
          {formatCurrency(total)}
          <span className="text-brand-100">View cart →</span>
        </span>
      </Link>
    </div>
  );
}
