'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Field, Input, Modal, Skeleton, Switch, Textarea, toast } from '@campus-bytes/ui';
import { ApiError } from '@/lib/api-client';
import { ImageUpload } from '@/components/shared/image-upload';
import {
  createRestaurantOwner,
  getRestaurantDetail,
  resetRestaurantPassword,
  updateRestaurant,
  type UpdateRestaurantInput,
} from '@/data/admin';

/**
 * Admin: edit an existing restaurant + its owner account. Loads the real profile
 * via GET /admin/restaurants/:id and saves via PATCH — scoped by restaurant id so
 * editing one outlet never touches another. Logo/cover upload goes through the
 * secure backend Cloudinary endpoint (device file picker, no URL input).
 */
export function EditRestaurantModal({
  restaurantId,
  open,
  onClose,
}: {
  restaurantId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-restaurant', restaurantId],
    queryFn: () => getRestaurantDetail(restaurantId!),
    enabled: open && !!restaurantId,
  });

  const [form, setForm] = useState<UpdateRestaurantInput>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Seed the form once the detail arrives.
  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      cuisine: data.cuisine,
      description: data.description,
      phone: data.phone,
      hours: data.hours,
      prepTimeMin: data.prepTimeMin,
      deliveryAvailable: data.deliveryAvailable,
      isPaused: data.isPaused,
      avgRating: data.avgRating,
      ownerName: data.ownerName,
      ownerEmail: data.ownerEmail,
    });
    setLogoUrl(data.logoUrl);
    setCoverUrl(data.coverUrl);
    setNewPassword('');
    setError(null);
  }, [data]);

  const set = <K extends keyof UpdateRestaurantInput>(k: K, v: UpdateRestaurantInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const patch: UpdateRestaurantInput = {
        ...form,
        logoUrl: logoUrl ?? '',
        coverUrl: coverUrl ?? '',
      };
      await updateRestaurant(restaurantId!, patch);
      if (newPassword) {
        if (data?.hasOwner) await resetRestaurantPassword(restaurantId!, newPassword);
        else
          await createRestaurantOwner(restaurantId!, {
            ownerEmail: form.ownerEmail ?? '',
            ownerName: form.ownerName,
            password: newPassword,
          });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
      qc.invalidateQueries({ queryKey: ['admin-restaurant', restaurantId] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
      toast({ tone: 'success', title: 'Restaurant updated', description: `${form.name} saved.` });
      onClose();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not save changes.'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Edit restaurant" variant="sheet">
      {isLoading || !data ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-11 rounded-md" />
          <Skeleton className="h-11 rounded-md" />
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if ((form.name ?? '').trim().length >= 2) save.mutate();
          }}
          className="flex flex-col gap-4"
        >
          {/* Images */}
          <div className="grid grid-cols-2 gap-3">
            <ImageUpload label="Logo" aspect="square" value={logoUrl} onChange={setLogoUrl} />
            <ImageUpload label="Cover / banner" aspect="video" value={coverUrl} onChange={setCoverUrl} />
          </div>

          <Field label="Restaurant name" htmlFor="er-name">
            <Input id="er-name" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Cuisine / tagline" htmlFor="er-cuisine">
            <Input id="er-cuisine" value={form.cuisine ?? ''} onChange={(e) => set('cuisine', e.target.value)} />
          </Field>
          <Field label="Description" htmlFor="er-desc">
            <Textarea id="er-desc" rows={3} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" htmlFor="er-phone">
              <Input id="er-phone" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Opening hours" htmlFor="er-hours">
              <Input id="er-hours" value={form.hours ?? ''} onChange={(e) => set('hours', e.target.value)} placeholder="8 AM – 11 PM" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Delivery ETA (min)" htmlFor="er-eta">
              <Input
                id="er-eta"
                type="number"
                min={1}
                value={form.prepTimeMin ?? 15}
                onChange={(e) => set('prepTimeMin', Number(e.target.value))}
              />
            </Field>
            <Field label="Rating (0–5)" htmlFor="er-rating">
              <Input
                id="er-rating"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={form.avgRating ?? 0}
                onChange={(e) => set('avgRating', Number(e.target.value))}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-md border border-line px-3 py-2">
            <span className="text-sm text-ink-700">Delivery available</span>
            <Switch checked={form.deliveryAvailable ?? true} onChange={(v) => set('deliveryAvailable', v)} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-line px-3 py-2">
            <span className="text-sm text-ink-700">Paused (hidden from students)</span>
            <Switch checked={form.isPaused ?? false} onChange={(v) => set('isPaused', v)} />
          </div>

          {/* Owner account */}
          <div className="mt-1 rounded-lg border border-line bg-surface-cream/40 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {data.hasOwner ? 'Owner account' : 'No owner — create one'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Owner name" htmlFor="er-oname">
                <Input id="er-oname" value={form.ownerName ?? ''} onChange={(e) => set('ownerName', e.target.value)} />
              </Field>
              <Field label="Owner login email" htmlFor="er-oemail">
                <Input id="er-oemail" type="email" value={form.ownerEmail ?? ''} onChange={(e) => set('ownerEmail', e.target.value)} />
              </Field>
            </div>
            <Field
              label={data.hasOwner ? 'Reset password (leave blank to keep)' : 'Set password (min 8)'}
              htmlFor="er-pw"
            >
              <Input
                id="er-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
          </div>

          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" block onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" block size="lg" loading={save.isPending} disabled={(form.name ?? '').trim().length < 2}>
              Save changes
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
