import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-surface-cream',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
        className,
      )}
      aria-hidden
      {...props}
    />
  );
}
