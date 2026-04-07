# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun dev           # Start Next.js dev server
bun build         # Production build
bun start         # Start production server
bun lint          # Run ESLint
bun seed          # Seed database (bun prisma/seed.ts)

# Database
bunx prisma migrate dev     # Run migrations in development
bunx prisma migrate deploy  # Apply migrations in production
bunx prisma studio          # Open Prisma Studio
bunx prisma generate        # Regenerate Prisma client (auto-runs on postinstall)
```

There is no test suite configured.

## Architecture Overview

Sirius is a **multi-tenant SaaS employee recognition platform** — teams earn, allocate, and redeem points through rewards, challenges, and peer-to-peer recognition.

**Tech stack**: Next.js App Router, React 19, Prisma + PostgreSQL, Better Auth, Razorpay, Tailwind CSS v4, shadcn/ui, Zod, React Hook Form, TanStack Table.

**Package manager**: Bun (prefer `bun` over `npm`/`npx`).

## Code Organization

```
app/
  (auth)/          # Login & signup pages (unauthenticated)
  (dashboard)/     # All protected pages — sidebar layout
  api/             # API routes: auth, billing, webhooks
actions/           # Server actions — all business logic lives here
lib/               # Core utilities: auth, authz, rbac, prisma, razorpay, subscriptions
schemas/           # Zod schemas used by server actions and forms
components/        # React components; components/ui/ is shadcn/ui
prisma/            # schema.prisma, migrations/, seed.ts
generated/         # Auto-generated Prisma client (do not edit)
```

## Key Patterns

### Auth & Authorization

- `lib/auth.ts` — Better Auth server config  
- `lib/auth-client.ts` — client-side auth helpers  
- `lib/authz.ts` — `requirePageAccess()` for page-level guards (throws/redirects), `getActionAuthContext()` for server actions (returns session + tenant)  
- `lib/rbac.ts` — Three roles: `ADMIN`, `MANAGER`, `EMPLOYEE`. Use `can(role, permission)` or `canAny(role, permissions)` for permission checks. 24 granular permissions are defined here.

Every server action starts by calling `getActionAuthContext()` and checking RBAC before touching the database.

### Server Actions

All mutations go through `actions/`. Pattern:
1. Call `getActionAuthContext()` to get `{ user, tenant }`
2. Validate input with Zod schema from `schemas/`
3. Check `can(user.role, permission)` — throw if unauthorized
4. Run Prisma query (usually in a transaction)
5. Return `{ success: true }` or `{ error: string }`

### Multi-Tenancy

Every model is scoped to a `tenantId`. Always filter by `tenantId` (obtained from auth context) — never expose cross-tenant data.

### Points System

- Each user has a `Wallet` (totalPoints, reservedPoints)
- All point movements are recorded in `PointLedger` with a `source` type: `ALLOCATION | PEER | REWARD | ADJUSTMENT | CHALLENGE`
- Manager and peer allocations have period-based budgets configured per `TenantSettings`

### Subscriptions

- `lib/subscriptions.ts` — FREE plan (10-seat limit) vs PRO plan (unlimited)
- Razorpay handles billing; `lib/razorpay.ts` wraps the SDK
- Webhook handler at `app/api/webhooks/razorpay/` syncs subscription state
- `TenantSubscription` model stores plan state: `ACTIVE | TRIALING | PAST_DUE | CANCELED | EXPIRED`

### Database

Prisma client is generated to `generated/prisma` (not the default location). Import the singleton from `lib/prisma.ts`.

## Environment Variables

Required in `.env`:
```
DATABASE_URL            # On Vercel use the connection pooler URL (e.g. Supabase/Neon pgBouncer port 6543)
BETTER_AUTH_SECRET      # Generate with: openssl rand -base64 32
BETTER_AUTH_URL         # Production: https://yourdomain.com
NEXT_PUBLIC_APP_URL     # Same as BETTER_AUTH_URL — used for invite links and emails

# Resend (email)
RESEND_API_KEY          # From resend.com dashboard
RESEND_FROM_EMAIL       # Verified sender address e.g. noreply@yourdomain.com

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# Razorpay
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
RAZORPAY_MODE           # "test" or "live"

# Billing
BILLING_COMPANY_NAME
BILLING_SUPPORT_EMAIL
```

## Key Patterns Added Post-Launch Prep

### Employee invitation flow
Employees no longer receive temp passwords. `createEmployee` creates the user record (no password) and calls `createAndSendInvitation` from `actions/invitation.ts`, which stores an `EmployeeInvitation` token and emails the invite via Resend. The employee accepts at `/invite/[token]`, sets their password, and is auto-signed in.

To resend an invite: call `resendInvitation(userId)` from `actions/invitation.ts`.

### Subscription banners
`getSubscriptionBannerState(tenantId)` in `lib/subscriptions.ts` returns the current banner type (`none | grace_period | expired_over_quota | expired`). The dashboard layout renders `<SubscriptionBanner>` for admins. After grace period expires, adding new users is blocked by the existing `isAtLimit` check in `getTenantSeatSummary`.

### Onboarding checklist
State is computed in `actions/onboarding.ts` from real data (settings configured, >1 user, ≥1 reward). Dismissed by writing `onboardingCompletedAt` on the `Tenant` model. Only shown to ADMINs.

### Rate limiting
`middleware.ts` intercepts `/api/auth/*` routes and calls `checkAuthRateLimit` from `lib/rate-limit.ts` (Upstash sliding window, 10 req/min per IP). Gracefully skips if `UPSTASH_REDIS_REST_URL` is absent (local dev).

### Migrations
The project now has migration history in `prisma/migrations/`. In production, run `bunx prisma migrate deploy` (not `db push`). `DIRECT_URL` must point to the non-pooled connection for migrations to work on Vercel.
