# Campus Bytes — Documented Assumptions

Decisions made where the source documents were silent or ambiguous. None change
the core business logic (3 panels · online payment only · university-cart delivery).

| # | Area | Assumption |
|---|------|-----------|
| 1 | Payment model | **Online only, no COD** anywhere. Follows Web Flow v1.1, which supersedes the PRD's optional COD. |
| 2 | Delivery | **University carts only.** No rider/delivery-partner accounts, ratings, earnings, or OTP handover. The UI reference's rider concept is intentionally dropped. |
| 3 | Student OTP channel | **Email OTP via Resend** for MVP. Auth layer is provider-agnostic so SMS OTP can be added later without changing the core. |
| 4 | Delivery confirmation | Restaurant/Admin marks `OUT_FOR_DELIVERY` and `DELIVERED` from the handover view. Carts have no login (managed resource, per PRD §7). |
| 5 | Non-residential students | Campus-zone pickup point is a selectable delivery location; hostel/room is the default. |
| 6 | Unaccepted-order timeout | Default 10-min configurable window → escalate to Admin (not silent auto-reject), to avoid losing prepaid orders. |
| 7 | Backend framework | NestJS (TypeScript) — shares types with the frontend. |
| 8 | Package manager / linker | pnpm with `node-linker=hoisted` (Windows symlink compatibility). |

## Phase status
- **Phase 1 (Foundation + Design System):** ✅ monorepo, tokens, `@campus-bytes/ui`, `@campus-bytes/types`.
- **Phase 2 (Student Panel):** ✅ Home, Food, Restaurant detail, Cart, Checkout, Order tracking, Orders, Profile, Notifications.
- **Phase 5 (Restaurant Panel):** ✅ Dashboard, Live Orders board (accept/reject/prep-time/ready/cart-handover/delivered — full state machine), Menu CRUD, Availability, Sales, Order History, Settings.
- **Phase 6 (Admin Panel):** ✅ Dashboard, Approvals, Restaurants, Students, Campus Carts, Hostels & Zones, Live Orders monitor, Analytics, Payments, Notifications broadcast, Support, Settings, Audit Logs.
- All panels interactive against in-memory, API-shaped data stores (`data/*.ts`) with mutable state anchored on `globalThis`. Next: cross-panel polish, then Phase 7 backend.

> **No fake functionality:** checkout's Pay button calls `startCheckout()`, which returns
> `not_implemented` until Phase 10 wires real Razorpay + server-side webhook verification.
> It never fabricates a paid order.
