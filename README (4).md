# AfricatalkingSMS

A small SMS dashboard for Africa's Talking: a Flask backend that sends SMS
and logs every attempt, and a Next.js frontend to drive it. Two halves,
one repo:

```
.
├── app.py                     backend: Flask API (this directory)
├── africastalking_client.py   backend: Africa's Talking SMS client
├── requirements.txt / Procfile
├── .env.example                backend env vars (AT_USERNAME, AT_API_KEY, ...)
└── frontend/                  Next.js 14 dashboard (see frontend/README.md)
```

## Backend

```bash
pip install -r requirements.txt
cp .env.example .env            # fill in AT_USERNAME / AT_API_KEY
python app.py                   # http://localhost:3000
```

**Routes**

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | `{"status": "ok"}` |
| GET | `/sms-logs` | every send attempt, newest first |
| POST | `/send-sms` | `{"phone": "+233...", "message": "..."}` — sends via Africa's Talking, logs the result either way |
| POST | `/dlr` | Africa's Talking delivery-report webhook (optional, see below) |

**Storage.** Logs live in a SQLite file (`DB_PATH`, default `./sms_logs.db`).
Railway's disk is ephemeral across deploys unless you attach a
[Volume](https://docs.railway.com/reference/volumes) — without one, each
redeploy starts with an empty log table (sends still work; you just lose
history). To persist logs, attach a volume and set `DB_PATH=/data/sms_logs.db`
(or wherever you mount it).

**Delivery reports.** Africa's Talking only tells you at send time that a
message was *queued*, not that it arrived — that's why a successful send is
logged as `sent`, not `delivered`. To get real delivery confirmation,
set this service's public `/dlr` URL (e.g.
`https://<this-service>.up.railway.app/dlr`) as the **Delivery Report
Callback URL** in your Africa's Talking account dashboard. Once that's set,
matching log rows move to `delivered` or `failed` as reports come in.

## Frontend

See [`frontend/README.md`](frontend/README.md). Point its
`NEXT_PUBLIC_API_URL` at this backend's deployed URL.

## Deploying both on Railway

This is one repo with two deployable halves — create two Railway services
from it, each with a different **Root Directory**:

1. **Backend service** — Root Directory `/` (repo root). Railway's
   Nixpacks builder picks up `requirements.txt` + `Procfile` automatically.
   Set the `AT_*`/`CORS_ORIGIN`/`DB_PATH` variables from `.env.example`.
2. **Frontend service** — Root Directory `/frontend`. Set
   `NEXT_PUBLIC_API_URL` to the backend service's public URL (generate a
   domain for it first), and `NEXT_PUBLIC_ADMIN_PASSWORD` if you want
   something other than the `admin123` default.

Both auto-deploy on push to whichever branch each Railway service is set to
watch — `main`, if you keep GitHub's default for a new repo.

## Security note

`/login`'s admin gate is a client-side-only check (a password compared in
the browser, then a flag written to `localStorage`) — fine for keeping
casual visitors off `/admin`, but anyone who opens devtools can set that
flag themselves without knowing the password. Don't put anything sensitive
behind it as-is; if this ever needs real protection, move the check to the
backend (an actual session/token the server issues and verifies).
