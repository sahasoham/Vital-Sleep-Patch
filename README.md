# Vital Sleep Patch

A premium marketing website for **Vital Sleep Patch** — a wire-free, at-home pediatric sleep apnea testing patch that replaces overnight hospital sleep studies.

## What's included

- **D2C landing page** (`/`) — for parents of children with suspected sleep apnea. Email waitlist signup with confirmation.
- **Hospital calculator** (`/for-hospitals`) — 3-step revenue upside calculator for Academic Medical Centers (AMCs). Includes a demo request form.
- **Admin dashboard** (`/admin`) — password-protected panel for viewing and exporting waitlist signups and demo requests as CSV.

## Tech stack

- **Frontend:** React + Vite, TailwindCSS, shadcn/ui, Framer Motion, Wouter
- **API:** Express 5 (Node.js)
- **Database:** PostgreSQL + Drizzle ORM
- **Monorepo:** pnpm workspaces
- **Email:** Nodemailer (SMTP)

## Getting started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database

### Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for session cookies |
| `ADMIN_PASSWORD` | Password for the `/admin` dashboard |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (587 for TLS) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password or app password |
| `ADMIN_EMAIL` | Receives a notification on every signup |

### Install & run

```bash
pnpm install
pnpm --filter @workspace/db run push   # create DB tables
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/website run dev
```

The website runs on the port set by `PORT`. The API server runs on port 8080.

## Project structure

```
artifacts/
  api-server/     # Express API
  website/        # React + Vite frontend
lib/
  api-spec/       # OpenAPI spec + codegen
  db/             # Drizzle schema + migrations
```
