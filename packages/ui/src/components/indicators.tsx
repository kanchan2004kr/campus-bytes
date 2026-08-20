import { Star } from 'lucide-react';
import { cn } from '../lib/cn';

/** Veg / non-veg square marker (Indian food convention). */
export function VegMark({ isVeg, className }: { isVeg: boolean; className?: string }) {
  const color = isVeg ? 'border-success text-success' : 'border-error text-error';
  return (
    <span
      className={cn(
        'inline-flex h-4 w-4 items-center justify-center rounded-[3px] border',
        color,
        className,
      )}
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      title={isVeg ? 'Veg' : 'Non-veg'}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
    </span>
  );
}

export function RatingStars({
  value,
  onChange,
  size = 20,
  readOnly,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-0.5" role={readOnly ? 'img' : 'radiogroup'}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn(!readOnly && 'transition-transform hover:scale-110', readOnly && 'cursor-default')}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            width={size}
            height={size}
            className={n <= value ? 'fill-warning text-warning' : 'fill-transparent text-line-strong'}
          />
        </button>
      ))}
    </div>
  );
}

/** Compact rating chip used on restaurant cards. */
export function RatingChip({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-ink-900/85 px-1.5 py-0.5 text-2xs font-semibold text-white',
        className,
      )}
    >
      <Star className="h-3 w-3 fill-warning text-warning" />
      {value.toFixed(1)}
    </span>
  );
}
