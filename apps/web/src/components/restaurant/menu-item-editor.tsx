'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FoodItem, MenuCategory } from '@campus-bytes/types';
import { useEffect, useState } from 'react';
import { Button, Field, Input, Modal, Select, Switch, Textarea, toast } from '@campus-bytes/ui';
import { saveItem, type MenuItemInput } from '@/data/restaurant-menu';
import { ImageUpload } from '@/components/shared/image-upload';

export function MenuItemEditor({
  open,
  onClose,
  categories,
  item,
  defaultCategoryId,
}: {
  open: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  item?: FoodItem | null;
  defaultCategoryId?: string;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<MenuItemInput>({
    categoryId: defaultCategoryId ?? categories[0]?.id ?? '',
    name: '',
    description: '',
    price: 0,
    isVeg: true,
    imageUrl: null,
  });
  const [priceText, setPriceText] = useState('');

  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description ?? '',
        price: item.price,
        isVeg: item.isVeg,
        imageUrl: item.imageUrl,
      });
      setPriceText(String(item.price));
    } else {
      setForm({
        categoryId: defaultCategoryId ?? categories[0]?.id ?? '',
        name: '',
        description: '',
        price: 0,
        isVeg: true,
        imageUrl: null,
      });
      setPriceText('');
    }
  }, [open, item, defaultCategoryId, categories]);

  const save = useMutation({
    mutationFn: () => saveItem({ ...form, price: Number(priceText) || 0 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['r-menu'] });
      onClose();
      toast({ tone: 'success', title: item ? 'Item updated' : 'Item added' });
    },
  });

  const valid = form.name.trim().length > 0 && Number(priceText) > 0 && form.categoryId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? 'Edit food item' : 'Add food item'}
      variant="sheet"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} loading={save.isPending} onClick={() => save.mutate()}>
            {item ? 'Save changes' : 'Add item'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Item name" htmlFor="mi-name">
          <Input
            id="mi-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Masala Maggie"
            maxLength={80}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (₹)" htmlFor="mi-price">
            <Input
              id="mi-price"
              inputMode="numeric"
              value={priceText}
              onChange={(e) => setPriceText(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="60"
            />
          </Field>
          <Field label="Category" htmlFor="mi-cat">
            <Select
              id="mi-cat"
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Description" htmlFor="mi-desc" hint="Shown to students on the menu.">
          <Textarea
            id="mi-desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short, appetising description…"
            maxLength={280}
          />
        </Field>

        <div className="max-w-[220px]">
          <ImageUpload
            label="Food image"
            value={form.imageUrl}
            onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
            aspect="square"
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-line px-3.5 py-3">
          <span className="text-sm font-medium text-ink-700">Vegetarian</span>
          <Switch checked={form.isVeg} onChange={(v) => setForm((f) => ({ ...f, isVeg: v }))} label="Vegetarian" />
        </div>
      </div>
    </Modal>
  );
}
