'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Field, Input, Modal, toast } from '@campus-bytes/ui';
import { ApiError } from '@/lib/api-client';
import { createRestaurant } from '@/data/admin';

/**
 * Admin: create a restaurant + its owner login in one step. Reuses the tested
 * POST /admin/restaurants endpoint; the new owner can log in immediately.
 */
export function CreateRestaurantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [password, setPassword] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('');
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length >= 2 && ownerEmail.includes('@') && password.length >= 8;

  const reset = () => {
    setName(''); setOwnerEmail(''); setOwnerName(''); setPassword('');
    setCuisine(''); setPhone(''); setHours(''); setError(null);
  };

  const mutation = useMutation({
    mutationFn: () =>
      createRestaurant({ name, ownerEmail, ownerName: ownerName || undefined, password, cuisine, phone, hours }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
      toast({ tone: 'success', title: 'Restaurant created', description: `${r?.name} · owner can log in now.` });
      reset();
      onClose();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not create restaurant.'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Create restaurant" variant="sheet">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) mutation.mutate();
        }}
        className="flex flex-col gap-4"
      >
        <Field label="Restaurant name" htmlFor="cr-name">
          <Input id="cr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Le Gabriel" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cuisine / tagline" htmlFor="cr-cuisine">
            <Input id="cr-cuisine" value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="Multi-cuisine" />
          </Field>
          <Field label="Opening hours" htmlFor="cr-hours">
            <Input id="cr-hours" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="8 AM – 11 PM" />
          </Field>
        </div>
        <Field label="Owner name" htmlFor="cr-owner">
          <Input id="cr-owner" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner full name" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner login email" htmlFor="cr-email">
            <Input id="cr-email" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="owner@outlet.com" />
          </Field>
          <Field label="Phone" htmlFor="cr-phone">
            <Input id="cr-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9XXXXXXXXX" />
          </Field>
        </div>
        <Field label="Initial password (min 8)" htmlFor="cr-pass" error={error ?? undefined}>
          <Input id="cr-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <Button type="submit" block size="lg" loading={mutation.isPending} disabled={!valid}>
          Create restaurant + owner
        </Button>
      </form>
    </Modal>
  );
}
