'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FoodItem } from '@campus-bytes/types';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import {
  Button,
  ConfirmDialog,
  Skeleton,
  Switch,
  VegMark,
  toast,
} from '@campus-bytes/ui';
import { getMenu, deleteItem, toggleAvailability, addCategory } from '@/data/restaurant-menu';
import { MenuItemEditor } from '@/components/restaurant/menu-item-editor';
import { formatCurrency } from '@/lib/format';

export default function MenuPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['r-menu'], queryFn: getMenu });
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [addingIn, setAddingIn] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [toDelete, setToDelete] = useState<FoodItem | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['r-menu'] });

  const avail = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => toggleAvailability(id, next),
    onSuccess: () => invalidate(),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      invalidate();
      toast({ tone: 'success', title: 'Item removed' });
    },
  });
  const addCat = useMutation({
    mutationFn: (name: string) => addCategory(name),
    onSuccess: () => {
      invalidate();
      toast({ tone: 'success', title: 'Category added' });
    },
  });

  const openAdd = (categoryId: string) => {
    setEditing(null);
    setAddingIn(categoryId);
    setEditorOpen(true);
  };
  const openEdit = (item: FoodItem) => {
    setEditing(item);
    setAddingIn(null);
    setEditorOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Menu</h1>
          <p className="text-sm text-ink-600">Manage categories, items, pricing and availability.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const name = window.prompt('New category name');
            if (name?.trim()) addCat.mutate(name.trim());
          }}
        >
          <Plus className="h-4 w-4" /> Add category
        </Button>
      </div>

      {isLoading || !data ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : (
        data.categories.map((cat) => {
          const items = data.items.filter((i) => i.categoryId === cat.id);
          return (
            <section key={cat.id} className="rounded-lg border border-line bg-surface shadow-sm">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="font-display text-base font-semibold text-ink-900">
                  {cat.name}
                  <span className="ml-2 text-sm font-normal text-ink-400">{items.length}</span>
                </h2>
                <Button variant="ghost" size="sm" onClick={() => openAdd(cat.id)}>
                  <Plus className="h-4 w-4" /> Add item
                </Button>
              </div>

              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-400">No items in this category yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-cream">
                        {item.imageUrl && (
                          <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <VegMark isVeg={item.isVeg} />
                          <p className="truncate font-medium text-ink-900">{item.name}</p>
                        </div>
                        <p className="text-sm text-ink-600">{formatCurrency(item.price)}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="hidden items-center gap-2 sm:flex">
                          <span className="text-xs text-ink-400">
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                          <Switch
                            checked={item.isAvailable}
                            size="sm"
                            onChange={(next) => avail.mutate({ id: item.id, next })}
                            label="Availability"
                          />
                        </div>
                        <button
                          onClick={() => openEdit(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-600 hover:bg-surface-cream"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setToDelete(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-600 hover:bg-error-soft hover:text-error"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}

      <MenuItemEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        categories={data?.categories ?? []}
        item={editing}
        defaultCategoryId={addingIn ?? undefined}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        title={`Delete “${toDelete?.name}”?`}
        description="This removes the item from your menu. Past orders keep their record."
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}
