/**
 * When NEXT_PUBLIC_API_URL is set, the data layer talks to the real NestJS API;
 * otherwise it falls back to the in-memory stores (so the polished UI keeps
 * working with no backend). This lets Phase 7 land without breaking local dev.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
export const API_ENABLED = API_BASE_URL.length > 0;
