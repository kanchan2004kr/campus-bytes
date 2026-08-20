'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PauseCircle, PlayCircle } from 'lucide-react';
import { Button, Skeleton, Switch, VegMark, cn, toast } from '@campus-bytes/ui';
import { getMenu, toggleAvailability } from '@/data/restaurant-menu';
import { getRestaurantSummary, setPaused } from '@/data/restaurant';
import { formatCurrency } from '@/lib/format';

export default function AvailabilityPage() {
  const qc = useQueryClient();
  const menu = useQuery({ queryKey: ['r-menu'], queryFn: getMenu });
  const summary = useQuery({ queryKey: ['r-summary'], queryFn: getRestaurantSummary });
  const isOpen = summary.data?.isOpen ?? true;

  const avail = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => toggleAvailability(id, next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['r-menu'] }),
  });
  const pause = useMutation({
    mutationFn: (next: boolean) => setPaused(!next),
    onSuccess: (_d, next) => {
      qc.invalidateQueries({ queryKey: ['r-summary'] });
      toast({
        tone: next ? 'success' : 'warning',
        title: next ? 'Restaurant resumed' : 'Restaurant paused',
      });
    },
  });

  const items = menu.data?.items ?? [];
  const unavailable = items.filter((i) => !i.isAvailable).length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Availability</h1>
        <p className="text-sm text-ink-600">Fast toggles for peak hours. Changes apply to new orders instantly.</p>
      </div>

      {/* Pause whole restaurant */}
      <div
        className={cn(
          'flex items-center gap-4 rounded-lg border p-4 shadow-sm',
          isOpen ? 'border-line bg-surface' : 'border-warning bg-warning-soft',
        )}
      >
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-md',
            isOpen ? 'bg-success-soft text-success' : 'bg-warning text-warning-fg',
          )}
        >
          {isOpen ? <PlayCircle className="h-6 w-6" /> : <PauseCircle className="h-6 w-6" />}
        </span>
        <div className="flex-1">
          <p className="font-display font-semibold text-ink-900">
            {isOpen ? 'Accepting orders' : 'Paused — not accepting orders'}
          </p>
          <p className="text-sm text-ink-600">
            {isOpen
              ? 'Students can place new orders from your outlet.'
              : 'New orders are stopped. In-flight orders continue normally.'}
          </p>
        </div>
        <Button variant={isOpen ? 'outline' : 'primary'} onClick={() => pause.mutate(!isOpen)} loading={pause.isPending}>
          {isOpen ? 'Pause outlet' : 'Resume outlet'}
        </Button>
      </div>

      {/* Item availability */}
      <div className="rounded-lg border border-line bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-base font-semibold text-ink-900">Item availability</h2>
          {unavailable > 0 && (
            <span className="rounded-pill bg-error-soft px-2.5 py-1 text-2xs font-semibold text-error">
              {unavailable} unavailable
            </span>
          )}
        </div>
        {menu.isLoading ? (
          <div className="p-4">
            <Skeleton className="h-40 rounded-md" />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <VegMark isVeg={item.isVeg} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-900">{item.name}</p>
                  <p className="text-xs text-ink-400">{formatCurrency(item.price)}</p>
                </div>
                <span className={cn('text-xs font-medium', item.isAvailable ? 'text-success' : 'text-error')}>
                  {item.isAvailable ? 'Available' : 'Sold out'}
                </span>
                <Switch
                  checked={item.isAvailable}
                  onChange={(next) => avail.mutate({ id: item.id, next })}
                  label={`Toggle ${item.name}`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
