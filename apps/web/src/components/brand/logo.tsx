import { cn } from '@campus-bytes/ui';

/**
 * Campus Bytes brand mark — a rounded plate/bracket silhouette with a "bite"
 * notch, fused with a byte square. Minimal, works in mono for favicon/app icon.
 */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M16 2.5c7.456 0 13.5 6.044 13.5 13.5 0 1.79-.348 3.498-.98 5.06a4.2 4.2 0 0 0-5.08 5.08A13.44 13.44 0 0 1 16 29.5C8.544 29.5 2.5 23.456 2.5 16S8.544 2.5 16 2.5Z"
        fill="var(--brand-600)"
      />
      <circle cx="12" cy="13" r="2.1" fill="white" />
      <circle cx="20" cy="13" r="2.1" fill="white" />
      <path
        d="M11 19.5c1.2 1.7 2.98 2.7 5 2.7s3.8-1 5-2.7"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  size = 32,
  showWordmark = true,
}: {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-ink-900">
          Campus<span className="text-brand-600">Bytes</span>
        </span>
      )}
    </span>
  );
}
