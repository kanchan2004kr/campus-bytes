'use client';

import { cn } from '../lib/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

export function Switch({ checked, onChange, disabled, label, size = 'md' }: SwitchProps) {
  const dims = size === 'sm' ? { w: 'w-9', h: 'h-5', k: 'h-4 w-4', t: 'translate-x-4' } : { w: 'w-11', h: 'h-6', k: 'h-5 w-5', t: 'translate-x-5' };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-pill transition-colors disabled:opacity-50',
        dims.w,
        dims.h,
        checked ? 'bg-brand-600' : 'bg-line-strong',
      )}
    >
      <span
        className={cn(
          'inline-block translate-x-0.5 transform rounded-full bg-white shadow-sm transition-transform',
          dims.k,
          checked && dims.t,
        )}
      />
    </button>
  );
}
