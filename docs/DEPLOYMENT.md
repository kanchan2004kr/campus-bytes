# Campus Bytes — Production Deployment

Monorepo: `apps/web` (Next.js → Vercel) · `apps/api` (NestJS → Render) · Neon PostgreSQL.

## Backend → Render (`apps/api`)
A `render.yaml` blueprint is at the repo root. If deploying manually instead:

- **Root directory:** repo root (`.`) — the API depends on the `@campus-bytes/types` workspace package, so the whole pnpm workspace must be installed.
- **Build command:**
  `corepack enable && pnpm install && pnpm --filter @campus-bytes/api exec prisma generate && pnpm --filter @campus-bytes/api exec prisma migrate deploy`
- **Start command:** `pnpm --filter @campus-bytes/api run start:prod`
  (runs `src/main.ts` via ts-node — this is deliberate: it resolves the ESM `@campus-bytes/types` package and avoids the Nest CLI. `ts-node`/`typescript`/`tsconfig-paths` are runtime `dependencies`.)
- **Health check path:** `/api/v1/restaurants`
- **Env vars (Render dashboard — secrets never committed):**
  `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `RESEND_API_KEY`, `WEB_ORIGIN`
  plus non-secret: `NODE_ENV=production`, `DEFAULT_TENANT_SUBDOMAIN=nims`, `JWT_ACCESS_TTL=15m`, `JWT_REFRESH_TTL=7d`, `RESEND_FROM_EMAIL`.
  (`PORT` is provided by Render automatically; the app binds `0.0.0.0`.)

`prisma migrate deploy` only applies the existing migration history to Neon — it never resets or seeds.

## Frontend → Vercel (`apps/web`)
- **Framework preset:** Next.js
- **Root directory:** `apps/web`
- **Build command:** `pnpm build` (default) · **Install command:** `pnpm install` · **Output:** `.next` (default)
- **Env var:** `NEXT_PUBLIC_API_URL = https://<your-render-service>.onrender.com/api/v1`
  (optionally `NEXT_PUBLIC_WS_URL = https://<your-render-service>.onrender.com`)

The data layer switches to the live API automatically when `NEXT_PUBLIC_API_URL` is set (`API_ENABLED`). Leave it unset only for the in-memory demo.

## CORS
Set `WEB_ORIGIN` on Render to your Vercel production URL (comma-separated for multiple),
e.g. `https://campus-bytes.vercel.app`. The API allows exactly those origins with credentials (never `*`).

## Real email OTP
Set `RESEND_API_KEY` on Render. With `RESEND_FROM_EMAIL = onboarding@resend.dev`, Resend
delivers only to your Resend account owner's email. To email any student, verify a domain in
Resend and set `RESEND_FROM_EMAIL` to a sender on that domain. In production the OTP is never
logged to the console and never returned in API responses.
