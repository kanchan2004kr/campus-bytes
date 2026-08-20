# Campus Bytes API (NestJS + Prisma + PostgreSQL)

Modular monolith. REST under `/api/v1`. Realtime (Socket.IO) surface is wired and
ready for Phase 11. Razorpay is intentionally **not** integrated yet (Phase 10).

## What YOU need to provide

The backend needs a PostgreSQL database and a few secrets. Copy the root
`.env.example` to `.env` (at the repo root) and fill in **at minimum**:

```
DATABASE_URL   # a PostgreSQL connection string
DIRECT_URL     # same as DATABASE_URL locally; the direct URL on Neon/Supabase
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET   # any long random strings
```

Everything else has safe dev defaults:
- `RESEND_API_KEY` — leave blank in dev; **student OTP codes print to the API console**.
- `DEFAULT_TENANT_SUBDOMAIN=nims` — must match the seed.

> No credentials are invented for you. Use your own Postgres (local Docker, Neon,
> Supabase, RDS, …).

## First-time setup (run from repo root)

```bash
# 1. install (already done if you've been running the app)
pnpm install

# 2. generate the Prisma client
pnpm --filter @campus-bytes/api prisma:generate

# 3. create the database schema (needs DATABASE_URL/DIRECT_URL set)
pnpm --filter @campus-bytes/api prisma:migrate

# 4. seed development data (campus, hostels, restaurants, menu, dev accounts)
pnpm --filter @campus-bytes/api prisma:seed

# 5. run the API (http://localhost:4000/api/v1)
pnpm --filter @campus-bytes/api start:dev
```

## Connect the frontend to the real API

In `.env`, set:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Restart the web dev server. The data layer switches from in-memory to the live
API automatically (leave it blank to keep the in-memory demo).

## Development / seed accounts (DEV ONLY — not real credentials)

| Role       | Login                                   |
|------------|-----------------------------------------|
| Admin      | `admin@nims.dev` / `Admin@12345`        |
| Restaurant | `owner@vistacolline.dev` / `Owner@12345` (Vista Colline) |
| Student    | `student@nims.dev` (email OTP — code printed to API console) |

## Test

```bash
pnpm --filter @campus-bytes/api test
```

Covers the order state machine, RBAC guard, the one-restaurant cart rule,
server-side availability validation, and cross-tenant access denial.
