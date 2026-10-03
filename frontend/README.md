# SMS Dashboard — frontend

Next.js 14 (Pages Router) + TypeScript + Tailwind. Talks to the Flask
backend in `../` (see the repo root `README.md`) via `NEXT_PUBLIC_API_URL`.

```bash
npm install
cp .env.example .env.local      # point NEXT_PUBLIC_API_URL at the backend
npm run dev                     # http://localhost:3001 (or whatever's free)
```

## Pages

| Path | Purpose |
|---|---|
| `/` | Landing page |
| `/dashboard` | Send an SMS, view/search recent logs |
| `/login` | Admin login (see security note below) |
| `/admin` | Analytics: totals, today's count, success rate, status breakdown |
| `/admin/logs` | Full log table — search, filter by status, CSV export |
| `/admin/settings` | Backend health check |

## Security note

The admin gate is client-side only (see repo root `README.md`) — fine for
keeping casual visitors out, not real protection.
