import { API_BASE_URL } from './api-config';
import { useAuthStore, getAccessToken } from './auth-store';

/**
 * Typed fetch wrapper for the Campus Bytes API. Adds the bearer token, unwraps
 * the standard error envelope, and transparently refreshes an expired access
 * token once on 401. Endpoints mirror PRD §14.
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

const REQUEST_TIMEOUT_MS = 20_000;

async function raw(method: string, path: string, body: unknown, token: string | null): Promise<Response> {
  // Abort hung requests so a slow/cold backend surfaces an error instead of
  // leaving callers (and their loading spinners/modals) stuck forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (e) {
    // Network failure or timeout → a typed ApiError so the UI can show a message.
    const aborted = e instanceof DOMException && e.name === 'AbortError';
    throw new ApiError(
      aborted ? 'TIMEOUT' : 'NETWORK',
      aborted
        ? 'The server took too long to respond. Please try again.'
        : 'Unable to connect to the server. Please try again.',
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

let refreshing: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return null;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await raw('POST', '/auth/refresh', { refreshToken }, null);
        if (!res.ok) return null;
        const data = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
          user: import('./auth-store').SessionUser;
        };
        useAuthStore.getState().setSession(data);
        return data.accessToken;
      } catch {
        return null;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const isAuthCall = path.startsWith('/auth/');
  let res = await raw(method, path, body, getAccessToken());

  // Transparent refresh + retry once (skip for the auth endpoints themselves).
  if (res.status === 401 && !isAuthCall) {
    const fresh = await tryRefresh();
    if (fresh) {
      res = await raw(method, path, body, fresh);
    } else {
      useAuthStore.getState().clear();
    }
  }

  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(err?.code ?? 'ERROR', err?.message ?? res.statusText, res.status);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
