'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Field, Input, Select, Textarea, cn } from '@campus-bytes/ui';
import {
  CAMPUS_DELIVERY_LOCATIONS,
  DELIVERY_LOCATION_TYPE_LABELS,
  locationTypeRequiresRoom,
  type DeliveryLocationType,
} from '@campus-bytes/types';
import { saveDeliveryLocation, type DeliveryLocation } from '@/data/client';

const TYPES: DeliveryLocationType[] = ['hostel', 'university', 'gate'];

/**
 * The approved-location entry form (Hostel / University / Gate + room +
 * instructions). Writes to the single source of truth (student profile) via
 * saveDeliveryLocation. Reused by the header quick-change modal and the
 * full-page /delivery-address flow — never duplicated.
 */
export function DeliveryLocationForm({
  current,
  onSaved,
}: {
  current: DeliveryLocation | null;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [type, setType] = useState<DeliveryLocationType>(current?.type ?? 'hostel');
  const [name, setName] = useState<string>(current?.name ?? '');
  const [roomNo, setRoomNo] = useState<string>(current?.roomNo ?? '');
  const [instructions, setInstructions] = useState<string>(current?.instructions ?? '');
  const [error, setError] = useState<string | null>(null);

  // Keep the form in sync with the saved location (it can load asynchronously).
  useEffect(() => {
    setType(current?.type ?? 'hostel');
    setName(current?.name ?? '');
    setRoomNo(current?.roomNo ?? '');
    setInstructions(current?.instructions ?? '');
    setError(null);
  }, [current]);

  const options = CAMPUS_DELIVERY_LOCATIONS[type];
  const needsRoom = locationTypeRequiresRoom(type);

  const mutation = useMutation({
    mutationFn: () => saveDeliveryLocation({ type, name, roomNo, instructions }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['student-profile'] });
      onSaved();
    },
    onError: () => setError('Unable to save location. Please try again.'),
  });

  const submit = () => {
    setError(null);
    if (!name) return setError('Please select a delivery location.');
    if (needsRoom && !roomNo.trim()) return setError('Room number is required for hostel delivery.');
    mutation.mutate();
  };

  const pickType = (t: DeliveryLocationType) => {
    setType(t);
    setName('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => pickType(t)}
            className={cn(
              'rounded-md border px-2 py-2 text-sm font-medium transition-colors',
              type === t
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-line text-ink-600 hover:bg-surface-cream',
            )}
          >
            {DELIVERY_LOCATION_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <Field label={`Select ${DELIVERY_LOCATION_TYPE_LABELS[type]}`} htmlFor="dl-name">
        <Select id="dl-name" value={name} onChange={(e) => setName(e.target.value)}>
          <option value="">Choose…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      </Field>

      {needsRoom && (
        <Field label="Room number" htmlFor="dl-room">
          <Input
            id="dl-room"
            value={roomNo}
            onChange={(e) => setRoomNo(e.target.value)}
            placeholder="e.g. 204"
            inputMode="numeric"
          />
        </Field>
      )}

      <Field label="Delivery instructions (optional)" htmlFor="dl-instr" error={error ?? undefined}>
        <Textarea
          id="dl-instr"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Call when you reach the hostel gate"
          rows={2}
        />
      </Field>

      <Button block size="lg" loading={mutation.isPending} onClick={submit}>
        Save delivery location
      </Button>
    </div>
  );
}
