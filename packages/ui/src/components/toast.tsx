'use client';

import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { cn } from '../lib/cn';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';
interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

// Dependency-free module store so any component can call toast(...).
let toasts: Toast[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

function emit() {
  listeners.forEach((l) => l());
}

export function toast(input: { tone?: ToastTone; title: string; description?: string; duration?: number }) {
  const id = nextId++;
  toasts = [...toasts, { id, tone: input.tone ?? 'info', title: input.title, description: input.description }];
  emit();
  const duration = input.duration ?? 3500;
  if (duration > 0) setTimeout(() => dismiss(id), duration);
  return id;
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const TONE_META: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-success' },
  error: { icon: XCircle, className: 'text-error' },
  info: { icon: Info, className: 'text-info' },
  warning: { icon: TriangleAlert, className: 'text-warning-fg' },
};

export function Toaster() {
  const items = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => toasts,
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-4 sm:top-auto sm:items-end sm:pr-6">
      {items.map((t) => {
        const { icon: Icon, className } = TONE_META[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-md border border-line bg-surface p-3.5 shadow-lg"
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', className)} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-900">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-ink-600">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="text-ink-400 hover:text-ink-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
