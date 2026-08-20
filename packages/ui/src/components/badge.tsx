import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import type { StatusTone } from '@campus-bytes/types';
import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill font-medium leading-none',
  {
    variants: {
      tone: {
        brand: 'bg-brand-100 text-brand-700',
        info: 'bg-info-soft text-info',
        success: 'bg-success-soft text-success',
        warning: 'bg-warning-soft text-warning-fg',
        error: 'bg-error-soft text-error',
        muted: 'bg-surface-cream text-ink-600',
        neutral: 'bg-surface-cream text-ink-700 border border-line',
      },
      size: {
        sm: 'px-2 py-0.5 text-2xs',
        md: 'px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, tone, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** Convenience wrapper for status pills driven by shared status-meta. */
export function StatusPill({
  tone,
  label,
  className,
  size,
}: {
  tone: StatusTone;
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <Badge tone={tone} size={size} dot className={className}>
      {label}
    </Badge>
  );
}
