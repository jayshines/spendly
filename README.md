# Spendly

A calm, fast expense tracker. NestJS + Prisma + PostgreSQL API, Next.js + Tailwind UI.

```
spendly/
  api/                 NestJS API (JWT auth, categories, expenses, monthly summary, Swagger)
  web/                 Next.js 14 app (App Router, Tailwind, SWR, recharts)
  docker-compose.yml   Local PostgreSQL 16
```

## Run it locally

You need Node 20+ and Docker Desktop. Run each step in its own terminal.

```bash
# 1. Database
docker compose up -d

# 2. API  (http://localhost:4000, Swagger at /api)
cd api
cp .env.example .env            # already created if you followed the setup
npm install
npx prisma migrate dev          # creates the tables
npx prisma db seed              # demo user + ~57 expenses
npm run start:dev

# 3. Web  (http://localhost:3002)
cd web
cp .env.local.example .env.local
npm install
npm run dev
```

Demo login: `demo@spendly.dev` / `demo12345`

To stop everything: `Ctrl+C` in each terminal, then `docker compose stop`
(your data stays in the `spendly-data` volume; `docker compose down -v` deletes it).

## API

Swagger UI: http://localhost:4000/api (use the **Authorize** button with the token from `/auth/login`).

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | Returns `{ accessToken, user }` |
| GET | `/auth/me` | Current user |
| GET/POST | `/categories` | List (with expense counts) / create |
| PATCH/DELETE | `/categories/:id` | Delete returns 409 while the category has expenses |
| GET | `/expenses` | Filters: `categoryId`, `from`, `to`, `q`, `page`, `limit`. Newest first |
| POST | `/expenses` | `{ merchant, amount, date: "YYYY-MM-DD", categoryId, note? }` |
| GET/PATCH/DELETE | `/expenses/:id` | Other users' expenses return 404 |
| GET | `/summary?month=YYYY-MM` | Total, change vs last month, per-category breakdown, daily series |
| GET | `/health` | Liveness check |

Notes:
- Every route except `/auth/*` and `/health` needs `Authorization: Bearer <token>` and only ever sees the caller's data.
- Money is stored as `Decimal(12,2)` and summed in integer cents, so totals never drift.
- Run the tests with `cd api && npm test`.

## Deploying later (not set up yet)

Backend on Railway, frontend on Vercel. Nothing here has been deployed.

**API (Railway)**
1. Add a PostgreSQL service and reference its `DATABASE_URL` in the API service.
2. Set `JWT_SECRET` (long random string, e.g. `openssl rand -base64 48`), `JWT_EXPIRES_IN` and `CORS_ORIGIN` (your Vercel URL).
3. Root directory `api`. Build command `npm run build`. Start command `npx prisma migrate deploy && npm run start:prod`.

**Web (Vercel)**
1. Root directory `web`.
2. Set `NEXT_PUBLIC_API_URL` to the Railway API URL.

## Known trade-offs

- The JWT is stored in `localStorage` so the web and API can live on different domains. That is simple, but any XSS bug could read it. For a hardened setup, move to an `httpOnly` cookie issued by the API (or a Next.js route handler).
- The API has no rate limiting yet. Add `@nestjs/throttler` before exposing `/auth/login` publicly.
