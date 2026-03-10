# FlowSpace — Backend Setup Guide

## Architecture
- **Frontend**: `index.html` (single file, static)
- **Backend**: Vercel serverless functions in `/api/`
- **Database**: Upstash Redis (free tier — 10,000 req/day)

## Step 1 — Create Upstash Redis database (free)

1. Go to https://console.upstash.com
2. Click **"Create Database"**
3. Name: `flowspace`
4. Region: pick closest to you (e.g. `ap-southeast-1` for India)
5. Click **Create**
6. On the database page, scroll to **REST API** section
7. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## Step 2 — Add environment variables to Vercel

1. Go to https://vercel.com → your FlowSpace project → **Settings** → **Environment Variables**
2. Add these two variables:

```
UPSTASH_REDIS_REST_URL    = https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN  = your-token-here
```

3. Click **Save** for each.

## Step 3 — Deploy

Replace your Vercel project files with this folder structure:

```
flowspace/
├── api/
│   ├── _redis.js     ← Redis helper (not an endpoint)
│   ├── auth.js       ← POST/GET/DELETE /api/auth
│   ├── tasks.js      ← GET/POST /api/tasks
│   ├── events.js     ← GET/POST /api/events
│   └── emails.js     ← GET/POST /api/emails
├── index.html        ← Frontend (updated)
├── package.json
└── vercel.json
```

**Option A — GitHub (recommended):**
Push this folder to your GitHub repo. Vercel auto-deploys.

**Option B — Vercel CLI:**
```bash
npm i -g vercel
cd flowspace
vercel --prod
```

## Step 4 — Done!

After deploy:
- Sign in with Google → session stored in Redis (7-day expiry)
- Refresh the page → auto-login, no popup
- Add tasks/events → synced to Redis instantly
- Open from phone → same data

## API Endpoints (all require `?session=xxx` or `{session}` in body)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth | Create session after Google login |
| GET | /api/auth | Verify session / auto-login |
| DELETE | /api/auth | Logout |
| GET | /api/tasks | Get user's tasks |
| POST | /api/tasks | Save tasks |
| GET | /api/events | Get user's events |
| POST | /api/events | Save events |
| GET | /api/emails | Get read email IDs |
| POST | /api/emails | Mark email(s) as read |

## Free Tier Limits

| Service | Free Limit |
|---------|-----------|
| Vercel Functions | 100 GB-hrs/month |
| Upstash Redis | 10,000 req/day, 256MB storage |

Both are more than enough for personal use.
