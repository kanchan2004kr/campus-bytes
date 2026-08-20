import { Minus, Plus } from 'lucide-react';
import { cn } from '../lib/cn';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 50,
  size = 'md',
  className,
}: QuantityStepperProps) {
  const btn =
    size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border border-brand-200 bg-brand-50 p-1',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn(
          'flex items-center justify-center rounded-full text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-40',
          btn,
        )}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-6 text-center text-sm font-semibold tabular-nums text-ink-900">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(
          'flex items-center justify-center rounded-full text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-40',
          btn,
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
