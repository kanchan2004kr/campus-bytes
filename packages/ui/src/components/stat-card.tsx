import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/cn';

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: { value: string; direction: 'up' | 'down' | 'flat' };
  accent?: 'brand' | 'success' | 'warning' | 'info' | 'error' | 'neutral';
  className?: string;
}

const ACCENT: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning-fg',
  info: 'bg-info-soft text-info',
  error: 'bg-error-soft text-error',
  neutral: 'bg-surface-cream text-ink-600',
};

export function StatCard({ label, value, icon: Icon, trend, accent = 'neutral', className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border border-line bg-surface p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-600">{label}</span>
        {Icon && (
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-md', ACCENT[accent])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold tabular-nums text-ink-900">{value}</span>
        {trend && trend.direction !== 'flat' && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-semibold',
              trend.direction === 'up' ? 'text-success' : 'text-error',
            )}
          >
            {trend.direction === 'up' ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
