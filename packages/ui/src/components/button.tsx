import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-brand-fg hover:bg-brand-700 shadow-sm',
        secondary:
          'bg-surface-peach text-ink-900 hover:bg-brand-100 border border-transparent',
        outline: 'border border-line-strong bg-surface text-ink-900 hover:bg-surface-cream',
        ghost: 'text-ink-700 hover:bg-surface-cream',
        danger: 'bg-error text-error-fg hover:brightness-95 shadow-sm',
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-sm',
        md: 'h-11 px-5 text-sm rounded-md',
        lg: 'h-13 px-6 text-base rounded-md min-h-[3.25rem]',
        icon: 'h-10 w-10 rounded-md',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Spinner className="h-4 w-4" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
