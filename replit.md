# Vital Sleep Patch

A marketing website for Vital Sleep Patch — a wire-free, at-home pediatric sleep apnea testing patch that replaces overnight hospital sleep studies.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/website run dev` — run the frontend dev server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, shadcn/ui, Framer Motion, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Email: Nodemailer (SMTP)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/waitlist.ts` — waitlist table schema
- `artifacts/api-server/src/routes/waitlist.ts` — waitlist API routes
- `artifacts/api-server/src/lib/email.ts` — email sending (admin notifications + confirmations)
- `artifacts/website/src/` — React frontend (D2C landing page + /for-hospitals calculator)

## Email Setup

Configure these environment secrets to enable email notifications:

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | SMTP username / email address |
| `SMTP_PASS` | SMTP password or app password |
| `ADMIN_EMAIL` | Your email — receives a notification on every signup |
| `CONFIRMATION_EMAIL_TEMPLATE` | (optional) Custom HTML for the confirmation email sent to signups |

Without these set, the app still works — signups are saved to the database, but no emails are sent.

## Architecture decisions

- Contract-first: OpenAPI spec → codegen → typed hooks on frontend, Zod schemas on backend
- Email is fire-and-forget (non-blocking) — signup still succeeds even if email fails
- Duplicate email signups return 409 with a friendly message
- Waitlist position is returned on signup and can be shown on the landing page

## Product

- **D2C (`/`)**: Landing page for parents of kids with suspected sleep apnea. Email waitlist signup.
- **B2B (`/for-hospitals`)**: 3-step revenue upside calculator for Academic Medical Centers (AMCs).

## User preferences

- Brand name: "Vital Sleep Patch"
- Inspiration site: wearclair.com (don't copy, just reference the quality)

## Gotchas

- Run codegen after every OpenAPI spec change: `pnpm --filter @workspace/api-spec run codegen`
- SMTP credentials must be set as Replit secrets (not env vars in code)
- Gmail users: use an App Password, not your account password
