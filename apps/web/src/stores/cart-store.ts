'use client';

import type { CartLine, FoodItem } from '@campus-bytes/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  lines: CartLine[];
  notes: string;

  /** Attempt to add an item. Returns 'conflict' if it's from another restaurant. */
  addItem: (
    item: FoodItem,
    restaurantName: string,
    opts?: { force?: boolean },
  ) => 'added' | 'conflict';
  setQuantity: (foodItemId: string, quantity: number) => void;
  removeItem: (foodItemId: string) => void;
  setNotes: (notes: string) => void;
  clear: () => void;

  itemCount: () => number;
  itemTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      lines: [],
      notes: '',

      addItem: (item, restaurantName, opts) => {
        const state = get();
        const differentRestaurant =
          state.restaurantId !== null && state.restaurantId !== item.restaurantId;

        // Business rule: one cart = one restaurant. Caller must confirm a clear.
        if (differentRestaurant && !opts?.force) {
          return 'conflict';
        }

        const base =
          differentRestaurant || state.restaurantId === null
            ? { restaurantId: item.restaurantId, restaurantName, lines: [] as CartLine[], notes: '' }
            : { restaurantId: state.restaurantId, restaurantName: state.restaurantName, lines: state.lines, notes: state.notes };

        const existing = base.lines.find((l) => l.foodItemId === item.id);
        const lines = existing
          ? base.lines.map((l) =>
              l.foodItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l,
            )
          : [
              ...base.lines,
              {
                foodItemId: item.id,
                name: item.name,
                price: item.price,
                isVeg: item.isVeg,
                imageUrl: item.imageUrl,
                quantity: 1,
              },
            ];

        set({ ...base, lines });
        return 'added';
      },

      setQuantity: (foodItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(foodItemId);
          return;
        }
        set((s) => ({
          lines: s.lines.map((l) => (l.foodItemId === foodItemId ? { ...l, quantity } : l)),
        }));
      },

      removeItem: (foodItemId) =>
        set((s) => {
          const lines = s.lines.filter((l) => l.foodItemId !== foodItemId);
          return lines.length === 0
            ? { lines, restaurantId: null, restaurantName: null, notes: '' }
            : { lines };
        }),

      setNotes: (notes) => set({ notes }),
      clear: () => set({ restaurantId: null, restaurantName: null, lines: [], notes: '' }),

      itemCount: () => get().lines.reduce((n, l) => n + l.quantity, 0),
      itemTotal: () => get().lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    }),
    { name: 'campus-bytes-cart' },
  ),
);
