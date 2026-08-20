import { Truck } from 'lucide-react';
import { Badge } from '@campus-bytes/ui';

/**
 * University cart delivery card. Campus Bytes uses university-operated carts —
 * intentionally NO rider identity, rating, earnings, or OTP handover here.
 */
export function CartTracker({
  cartLabel,
  hostelName,
}: {
  cartLabel: string;
  hostelName: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white">
        <Truck className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display font-semibold text-ink-900">{cartLabel}</p>
          <Badge tone="brand" size="sm" dot>
            Live
          </Badge>
        </div>
        <p className="text-sm text-ink-600">On the way to {hostelName}</p>
      </div>
    </div>
  );
}
