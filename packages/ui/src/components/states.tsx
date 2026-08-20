import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Inbox, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';

interface StateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

function BaseState({ icon: Icon = Inbox, title, description, action, className }: StateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-cream text-brand-600">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-display text-lg font-semibold text-ink-900">{title}</p>
        {description && <p className="mx-auto max-w-xs text-sm text-ink-600">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function EmptyState(props: StateProps) {
  return <BaseState {...props} />;
}

export function ErrorState({
  onRetry,
  title = 'Something went wrong',
  description = 'We couldn’t load this right now. Please try again.',
  ...props
}: Partial<StateProps> & { onRetry?: () => void }) {
  return (
    <BaseState
      icon={AlertTriangle}
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
      {...props}
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <BaseState
      icon={WifiOff}
      title="You’re offline"
      description="Check your connection and try again."
      action={
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    />
  );
}
