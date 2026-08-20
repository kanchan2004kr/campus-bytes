'use client';

import { cn } from '@campus-bytes/ui';

export interface BarDatum {
  label: string;
  value: number;
}

/** Lightweight CSS bar chart — brand-consistent, no external chart dependency. */
export function BarChart({
  data,
  height = 160,
  valueFormat = (v) => String(v),
  className,
}: {
  data: BarDatum[];
  height?: number;
  valueFormat?: (v: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn('flex items-end gap-2', className)} style={{ height }}>
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label} className="group flex flex-1 flex-col items-center gap-1.5">
            <div className="relative flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-sm bg-brand-500/85 transition-all duration-300 group-hover:bg-brand-600"
                style={{ height: `${Math.max(2, pct)}%` }}
              >
                <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-2xs font-semibold text-ink-700 opacity-0 transition-opacity group-hover:opacity-100">
                  {valueFormat(d.value)}
                </span>
              </div>
            </div>
            <span className="text-2xs text-ink-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
