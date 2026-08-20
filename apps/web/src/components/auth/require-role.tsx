'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@campus-bytes/ui';
import { useAuthStore } from '@/lib/auth-store';
import { API_ENABLED } from '@/lib/api-config';

type Role = 'student' | 'restaurant' | 'admin';

/**
 * Client-side route guard. Redirects to /login when there's no session for the
 * required role. When the API is disabled (in-memory demo mode) it's a no-op,
 * so the polished UI stays browsable without a backend.
 */
export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!API_ENABLED) {
      setReady(true);
      return;
    }
    if (!hasHydrated) return; // wait for the persisted session to load before deciding
    if (!user) {
      router.replace(`/login?next=${role}`);
      return;
    }
    if (user.role !== role) {
      // Signed in as the wrong role — send to their own panel.
      const home = user.role === 'admin' ? '/admin' : user.role === 'restaurant' ? '/r' : '/';
      router.replace(home);
      return;
    }
    setReady(true);
  }, [user, role, router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-cream">
        <Spinner className="h-6 w-6 text-brand-600" />
      </div>
    );
  }
  return <>{children}</>;
}
