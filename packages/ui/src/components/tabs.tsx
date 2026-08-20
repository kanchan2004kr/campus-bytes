'use client';

import { cn } from '../lib/cn';

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-line', className)} role="tablist">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
              active ? 'text-brand-700' : 'text-ink-600 hover:text-ink-900',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-pill px-1.5 py-0.5 text-2xs font-semibold',
                  active ? 'bg-brand-100 text-brand-700' : 'bg-surface-cream text-ink-600',
                )}
              >
                {item.count}
              </span>
            )}
            {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />}
          </button>
        );
      })}
    </div>
  );
}
