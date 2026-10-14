# Relay — AI support inbox

Relay reads every inbound support email, sets priority, category and sentiment, writes a one-line summary and drafts the reply. A human approves it with one click.

- **Stack:** Next.js (App Router, server actions), Prisma, Tailwind, Anthropic SDK.
- **Triage:** runs on Claude (`claude-haiku-5-5`) when `ANTHROPIC_API_KEY` is set; falls back to a deterministic rules engine when it isn't, so the demo never breaks.
- **Auth:** signed-cookie sessions, one workspace per sign-in. The shared demo workspace is seeded with 20 realistic tickets; any email address gets a private sandbox with its own copy.
- **Database:** SQLite locally, Postgres in production (change the `provider` in `prisma/schema.prisma` and set `DATABASE_URL`).

## Run locally

```bash
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000 and click **Enter demo workspace**.

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` locally, a Postgres URL in production |
| `ANTHROPIC_API_KEY` | no | enables Claude triage; without it the rules engine runs |
| `SESSION_SECRET` | prod | HMAC secret for session cookies |

Built by Ali Sabir — https://contra.com/ali_sabir_bh29rvhc
