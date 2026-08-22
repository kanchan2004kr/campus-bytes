'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellPlus, Store } from 'lucide-react';
import { Button, Switch, cn, toast } from '@campus-bytes/ui';
import { getRestaurantSummary, setPaused, simulateIncomingOrder, CURRENT_RESTAURANT } from '@/data/restaurant';

export function RestaurantTopBar() {
  const qc = useQueryClient();
  const summary = useQuery({ queryKey: ['r-summary'], queryFn: getRestaurantSummary });
  const isOpen = summary.data?.isOpen ?? true;

  const pauseMut = useMutation({
    mutationFn: (next: boolean) => setPaused(!next),
    onSuccess: (_d, next) => {
      qc.invalidateQueries({ queryKey: ['r-summary'] });
      toast({
        tone: next ? 'success' : 'warning',
        title: next ? 'Restaurant is open' : 'Restaurant paused',
        description: next ? 'You are now receiving new orders.' : 'New orders are paused. In-flight orders continue.',
      });
    },
  });

  const simulateMut = useMutation({
    mutationFn: simulateIncomingOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['r-orders'] }),
  });

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-peach text-brand-700">
          <Store className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-sm font-semibold leading-tight text-ink-900">
            {CURRENT_RESTAURANT.name}
          </p>
          <p className="text-2xs text-ink-400">{CURRENT_RESTAURANT.cuisine}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dev-only demo affordance — hidden in production (real orders arrive via
            the realtime socket). */}
        {process.env.NODE_ENV !== 'production' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => simulateMut.mutate()}
            loading={simulateMut.isPending}
            className="hidden text-ink-600 sm:inline-flex"
            title="Demo only: simulate an incoming order"
          >
            <BellPlus className="h-4 w-4" /> Simulate order
          </Button>
        )}

        <div className="flex items-center gap-2 rounded-pill border border-line bg-surface px-3 py-1.5">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              isOpen ? 'bg-success animate-pulse' : 'bg-ink-400',
            )}
          />
          <span className="text-xs font-semibold text-ink-700">{isOpen ? 'Open' : 'Paused'}</span>
          <Switch checked={isOpen} onChange={(v) => pauseMut.mutate(v)} size="sm" label="Toggle open/paused" />
        </div>
      </div>
    </header>
  );
}
