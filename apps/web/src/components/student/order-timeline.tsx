'use client';

import { ORDER_TIMELINE, ORDER_STATUS_META, OrderStatus } from '@campus-bytes/types';
import { Check } from 'lucide-react';
import { cn } from '@campus-bytes/ui';

/** Vertical progress timeline for the happy path. Rejected/cancelled render separately. */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  const currentIndex = ORDER_TIMELINE.indexOf(status);

  return (
    <ol className="flex flex-col">
      {ORDER_TIMELINE.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const last = i === ORDER_TIMELINE.length - 1;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
                  done && 'border-success bg-success text-white',
                  active && 'border-brand-600 bg-brand-600 text-white animate-pulse-ring',
                  !done && !active && 'border-line bg-surface text-ink-400',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
              </span>
              {!last && (
                <span
                  className={cn('my-0.5 w-0.5 flex-1', i < currentIndex ? 'bg-success' : 'bg-line')}
                  style={{ minHeight: 28 }}
                />
              )}
            </div>
            <div className={cn('pb-6', last && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  active ? 'text-ink-900' : done ? 'text-ink-700' : 'text-ink-400',
                )}
              >
                {ORDER_STATUS_META[step].label}
              </p>
              {active && <p className="mt-0.5 text-xs text-brand-600">In progress</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
