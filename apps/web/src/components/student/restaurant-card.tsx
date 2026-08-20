'use client';

import type { Restaurant } from '@campus-bytes/types';
import { Clock, Flame } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, RatingChip, cn } from '@campus-bytes/ui';

const CROWD_META: Record<Restaurant['crowdLevel'], { label: string; tone: 'success' | 'warning' | 'error' }> = {
  low: { label: 'Low crowd', tone: 'success' },
  medium: { label: 'Moderate crowd', tone: 'warning' },
  high: { label: 'Busy', tone: 'error' },
};

export function RestaurantCard({ restaurant: r, className }: { restaurant: Restaurant; className?: string }) {
  const orderable = r.isOpen && !r.isPaused;
  const crowd = CROWD_META[r.crowdLevel];

  return (
    <Link
      href={orderable ? `/restaurant/${r.id}` : '#'}
      aria-disabled={!orderable}
      className={cn(
        'group block overflow-hidden rounded-lg border border-line bg-surface shadow-sm transition-all',
        orderable ? 'hover:-translate-y-0.5 hover:shadow-md' : 'pointer-events-none opacity-70',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-cream">
        {r.coverUrl && (
          <Image
            src={r.coverUrl}
            alt={r.name}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute left-2.5 top-2.5">
          <RatingChip value={r.avgRating} />
        </div>
        {!orderable && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-900/45">
            <span className="rounded-pill bg-bg px-3 py-1 text-xs font-semibold text-ink-900">
              Currently closed
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold leading-tight text-ink-900">{r.name}</h3>
        </div>
        <p className="line-clamp-1 text-xs text-ink-600">{r.cuisine}</p>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral" size="sm">
            <Clock className="h-3 w-3" />
            {r.prepTimeMin} min
          </Badge>
          <Badge tone={crowd.tone} size="sm">
            <Flame className="h-3 w-3" />
            {crowd.label}
          </Badge>
          {r.deliveryAvailable && (
            <Badge tone="brand" size="sm">
              Delivery
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
