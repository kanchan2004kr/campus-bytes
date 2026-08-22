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

// Generous enough to survive a Render free-tier cold start (the backend spins
// down when idle and the first request can take ~30-60s to wake). A shorter
// timeout caused false "server took too long" failures on the first OTP request.
const REQUEST_TIMEOUT_MS = 60_000;

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

/**
 * Multipart upload (real file → our backend). Mirrors `request`'s bearer-token +
 * one-shot 401 refresh, but sends FormData (no JSON Content-Type, so the browser
 * sets the multipart boundary itself).
 */
async function uploadFile<T>(path: string, form: FormData): Promise<T> {
  const send = (token: string | null) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    return fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
      credentials: 'include',
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  };

  let res: Response;
  try {
    res = await send(getAccessToken());
    if (res.status === 401) {
      const fresh = await tryRefresh();
      if (fresh) res = await send(fresh);
      else useAuthStore.getState().clear();
    }
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === 'AbortError';
    throw new ApiError(
      aborted ? 'TIMEOUT' : 'NETWORK',
      aborted
        ? 'The server took too long to respond. Please try again.'
        : 'Unable to connect to the server. Please try again.',
      0,
    );
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(err?.code ?? 'ERROR', err?.message ?? res.statusText, res.status);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  upload: uploadFile,
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
