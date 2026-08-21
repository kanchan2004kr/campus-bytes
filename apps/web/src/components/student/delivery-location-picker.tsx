'use client';

import { Modal } from '@campus-bytes/ui';
import { DeliveryLocationForm } from './delivery-location-form';
import type { DeliveryLocation } from '@/data/client';

/**
 * Modal quick-change for the header "Deliver to" selector. Wraps the shared
 * DeliveryLocationForm so the entry UI is identical to the /delivery-address
 * page and writes to the same single source of truth.
 */
export function DeliveryLocationPicker({
  open,
  onClose,
  current,
}: {
  open: boolean;
  onClose: () => void;
  current: DeliveryLocation | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Select delivery location" variant="sheet">
      <DeliveryLocationForm current={current} onSaved={onClose} />
    </Modal>
  );
}
