'use client';

import type { FoodItem } from '@campus-bytes/types';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Button, ConfirmDialog, QuantityStepper, VegMark, cn, toast } from '@campus-bytes/ui';
import { useCartStore } from '@/stores/cart-store';
import { formatCurrency } from '@/lib/format';

export function FoodCard({ item, restaurantName }: { item: FoodItem; restaurantName: string }) {
  const [conflict, setConflict] = useState(false);
  const line = useCartStore((s) => s.lines.find((l) => l.foodItemId === item.id));
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);

  const handleAdd = (force = false) => {
    const result = addItem(item, restaurantName, { force });
    if (result === 'conflict') {
      setConflict(true);
      return;
    }
    toast({ tone: 'success', title: `Added ${item.name}` });
  };

  return (
    <>
      <div className="flex gap-3 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <VegMark isVeg={item.isVeg} />
            <h4 className="truncate font-medium text-ink-900">{item.name}</h4>
          </div>
          <p className="mt-1 text-sm font-semibold text-ink-900">{formatCurrency(item.price)}</p>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-600">{item.description}</p>
          )}
        </div>

        <div className="relative shrink-0">
          <div className="relative h-24 w-24 overflow-hidden rounded-md bg-surface-cream">
            {item.imageUrl && (
              <Image src={item.imageUrl} alt={item.name} fill sizes="96px" className="object-cover" />
            )}
            {!item.isAvailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-900/50">
                <span className="text-2xs font-semibold text-white">Sold out</span>
              </div>
            )}
          </div>

          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
            {!item.isAvailable ? null : line ? (
              <QuantityStepper
                value={line.quantity}
                min={0}
                onChange={(q) => setQuantity(item.id, q)}
                size="sm"
                className="bg-surface shadow-md"
              />
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAdd()}
                className={cn('bg-surface px-4 font-semibold text-brand-700 shadow-md')}
              >
                Add <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={conflict}
        onClose={() => setConflict(false)}
        onConfirm={() => handleAdd(true)}
        title="Start a new cart?"
        description={`Your cart has items from another outlet. Adding ${item.name} will clear it and start a new order from ${restaurantName}.`}
        confirmLabel="Clear & add"
        tone="danger"
      />
    </>
  );
}
