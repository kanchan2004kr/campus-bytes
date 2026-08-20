'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'restaurant' | 'admin';
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  hasHydrated: boolean;
  setSession: (s: { accessToken: string; refreshToken: string; user: SessionUser }) => void;
  clear: () => void;
  setHasHydrated: (v: boolean) => void;
}

/** Client-side session store. Tokens are set by the auth flow (Phase 8). */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      setSession: (s) => set({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'campus-bytes-auth',
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);

/** Non-hook accessor for the api-client. */
export function getAccessToken(): string | null {
  try {
    return useAuthStore.getState().accessToken;
  } catch {
    return null;
  }
}
