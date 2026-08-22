import { cn } from '@campus-bytes/ui';

/**
 * CampusBytes brand mark. The wordmark "CampusBytes" IS the logo — there is no
 * icon/image. Kept as a single shared component so the student app, restaurant
 * panel, and admin panel stay visually consistent. `size` maps to the font size
 * so existing callers keep working.
 */
export function Logo({
  className,
  size = 32,
  // Retained for backward-compat; the text wordmark is always shown.
  showWordmark: _showWordmark = true,
}: {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}) {
  return (
    <span
      className={cn(
        'font-display font-bold leading-none tracking-tight text-ink-900',
        className,
      )}
      style={{ fontSize: Math.round(size * 0.62) }}
    >
      Campus<span className="text-brand-600">Bytes</span>
    </span>
  );
}
