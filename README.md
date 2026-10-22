# OverloadHQ 🏋️

> A **progressive overload** gym tracker with AI coaching. Free, private, multi-user.

Track workouts, compare week-over-week performance, visualize progress with line graphs, and get AI-powered coaching suggestions — all from your phone.

## Features

- **Log workouts** – date, muscle group, exercises, sets, weight, reps, form notes
- **Progressive overload tracking** – week vs. week comparison with green/red/grey indicators
- **Line charts** – max weight, reps, volume, estimated 1RM per exercise (Recharts)
- **AI Coach** – Gemini (primary) / Groq (fallback) / rule-based engine (offline)
- **Dashboard** – weekly stats, streak, overload score, recent PRs
- **Multi-user** – every user gets a fully private, isolated account
- **PWA** – installable on your phone's home screen
- **Mobile-first** – bottom tab navigation, touch-friendly numeric inputs
- **Dark theme** – electric green accent, glassmorphism, shimmer PR badges

---

## Tech Stack (All Free)

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, TanStack Query | Vercel (free) |
| Backend | Express, TypeScript, Prisma, Zod, Pino, bcrypt, JWT | Render (free) |
| Database | PostgreSQL | Neon (free) |
| AI | Google Gemini API → Groq API → Rule engine | API keys only |
| Email | Brevo free SMTP (optional) | — |

---

## FREE-TIER LIMITS

| Service | Free Limit | What happens at the limit |
|---------|-----------|--------------------------|
| **Neon Postgres** | 0.5 GB storage, 1 project, autosuspend after 5 min idle | App auto-retries on cold start. Delete old data or upgrade if storage fills up. |
| **Render Web Service** | 750 hours/month, spins down after 15 min idle, ~30s cold start | Set up UptimeRobot (free) to ping `/health` every 5 min. Shows "waking up" loader. |
| **Vercel Hobby** | 100 GB bandwidth, 100 deployments/day, serverless limits | More than enough for personal use. |
| **Gemini API** | ~1500 RPD, 15 RPM, 1M TPM (check docs, limits change) | Falls back to Groq, then rule engine. Set `AI_DAILY_LIMIT` env var. |
| **Groq API** | ~30 RPM, 14400 RPD (check docs) | Falls back to rule engine. |
| **Brevo SMTP** | 300 emails/day, single verified sender | Only used for password resets. Use `scripts/reset-password.ts` as manual fallback. |
| **UptimeRobot** | 50 monitors, 5 min interval | 1 monitor is plenty. |

**If a limit is hit:** The app gracefully degrades — AI falls back to the rule engine, cold starts show a loader, and password resets can be done via CLI script. No paid service is ever required.

---

## Project Structure

```
overloadhq/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.ts                # Seed exercises
│   ├── scripts/
│   │   ├── reset-password.ts      # Manual password reset
│   │   └── user-count.ts          # Admin: list users
│   ├── src/
│   │   ├── config.ts              # APP_NAME and env config
│   │   ├── db.ts                  # Prisma client + Neon retry
│   │   ├── index.ts               # Express app entry point
│   │   ├── logger.ts              # Pino logger
│   │   ├── schemas.ts             # Zod validation schemas
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT auth + cookie helpers
│   │   │   ├── errorHandler.ts    # Error handler + AppError
│   │   │   └── validate.ts        # Zod validation middleware
│   │   ├── routes/
│   │   │   ├── auth.ts            # Register, login, logout, forgot/reset
│   │   │   ├── user.ts            # Profile, password, delete account
│   │   │   ├── workouts.ts        # CRUD + sample data
│   │   │   ├── exercises.ts       # Exercise library
│   │   │   ├── progress.ts        # Charts, comparisons, PRs
│   │   │   ├── export.ts          # CSV export
│   │   │   └── ai.ts              # AI analysis (Gemini→Groq→Rules)
│   │   └── services/
│   │       ├── email.ts           # Brevo SMTP
│   │       ├── gemini.ts          # Google Gemini API
│   │       ├── groq.ts            # Groq API
│   │       └── ruleEngine.ts      # Rule-based fallback
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   └── favicon.svg
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root layout (Inter font, providers)
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── globals.css        # Dark theme, glass effects
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── onboarding/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── (app)/             # Authenticated routes
│   │   │       ├── layout.tsx     # App shell + bottom tabs
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── log/page.tsx
│   │   │       ├── history/page.tsx
│   │   │       ├── progress/page.tsx
│   │   │       ├── ai-coach/page.tsx
│   │   │       └── profile/page.tsx
│   │   ├── components/ui/         # shadcn/ui components
│   │   └── lib/
│   │       ├── api.ts             # API client
│   │       ├── auth-context.tsx   # Auth state management
│   │       ├── config.ts          # APP_NAME, constants
│   │       ├── providers.tsx      # QueryClient + AuthProvider
│   │       └── utils.ts           # cn, formatWeight, etc.
│   ├── .env.example
│   ├── next.config.js             # API rewrites to backend
│   ├── tailwind.config.js
│   ├── package.json
│   └── tsconfig.json
├── render.yaml                    # Render deployment blueprint
├── .gitignore
└── README.md
```

---

## Step-by-Step Deployment Guide (All Free)

### Prerequisites
- Node.js 18+
- Git
- Free accounts on: [GitHub](https://github.com), [Neon](https://neon.tech), [Render](https://render.com), [Vercel](https://vercel.com)
- Optional: [Google AI Studio](https://aistudio.google.com/apikey), [Groq Console](https://console.groq.com)

### 1. Create a GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create overloadhq --public --source=. --push
# Or: create on github.com and push manually
```

### 2. Create a Neon Database (Free)
1. Go to [neon.tech](https://neon.tech) → Sign up (free, no credit card)
2. Create a project (e.g., "overloadhq")
3. Copy TWO connection strings from the dashboard:
   - **Pooled** (for `DATABASE_URL`): `postgresql://...?sslmode=require&pgbouncer=true`
   - **Direct** (for `DIRECT_URL`): `postgresql://...?sslmode=require`

### 3. Get AI API Keys (Free, Optional)
- **Gemini**: Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → Create API key (free)
- **Groq**: Go to [console.groq.com/keys](https://console.groq.com/keys) → Create API key (free)
- Both are optional — the rule-based engine works without any API key.

### 4. Local Development
```bash
# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Backend setup
cd backend
cp .env.example .env
# Edit .env: add DATABASE_URL, DIRECT_URL, JWT_SECRET (any random string)

# Run migrations + seed
npx prisma migrate dev --name init
npx tsx prisma/seed.ts

# Start backend
npm run dev
# → Running on http://localhost:4000

# Frontend setup (new terminal)
cd frontend
cp .env.example .env
# BACKEND_URL=http://localhost:4000

npm run dev
# → Running on http://localhost:3000
```

### 5. Deploy Backend to Render (Free)
1. Go to [render.com](https://render.com) → New Web Service → Connect your GitHub repo
2. Settings:
   - **Name**: `overloadhq-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx tsc`
   - **Start Command**: `npx prisma migrate deploy && node dist/index.js`
   - **Plan**: Free
3. Add environment variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (Neon pooled URL)
   - `DIRECT_URL` = (Neon direct URL)
   - `JWT_SECRET` = (generate: `openssl rand -hex 32`)
   - `FRONTEND_URL` = (your Vercel URL, e.g., `https://overloadhq.vercel.app`)
   - `GEMINI_API_KEY` = (from step 3)
   - `GEMINI_MODEL` = `gemini-2.0-flash`
   - `GROQ_API_KEY` = (from step 3, optional)
   - `INVITE_CODE` = (set if you want closed registration)
4. Deploy → Get the URL (e.g., `https://overloadhq-backend.onrender.com`)

### 6. Deploy Frontend to Vercel (Free)
1. Go to [vercel.com](https://vercel.com) → Import your GitHub repo
2. Settings:
   - **Framework**: Next.js
   - **Root Directory**: `frontend`
3. Add environment variables:
   - `BACKEND_URL` = `https://overloadhq-backend.onrender.com` (Render URL)
   - `NEXT_PUBLIC_APP_NAME` = `OverloadHQ`
4. Deploy → Get the URL (e.g., `https://overloadhq.vercel.app`)
5. **Update** the `FRONTEND_URL` env var in Render to match your Vercel URL.

### 7. Set Up UptimeRobot (Free)
1. Go to [uptimerobot.com](https://uptimerobot.com) → Sign up (free)
2. Add monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://overloadhq-backend.onrender.com/health`
   - **Interval**: 5 minutes
3. This prevents the Render free tier from spinning down.

### 8. Seed the Database
```bash
# Run from the backend directory with DATABASE_URL set
cd backend
npx tsx prisma/seed.ts
```

### 9. Share with Friends
- Send them the Vercel URL
- If `INVITE_CODE` is set, share the invite link: `https://overloadhq.vercel.app/signup?code=YOUR_CODE`

---

## Environment Variables Reference

### Backend (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon pooled connection string |
| `DIRECT_URL` | ✅ | Neon direct connection string |
| `JWT_SECRET` | ✅ | Random secret for JWT signing |
| `FRONTEND_URL` | ✅ | Vercel app URL (for CORS) |
| `PORT` | ❌ | Default: 4000 |
| `INVITE_CODE` | ❌ | If set, required for registration |
| `GEMINI_API_KEY` | ❌ | Google AI Studio key |
| `GEMINI_MODEL` | ❌ | Default: `gemini-2.0-flash` |
| `GROQ_API_KEY` | ❌ | Groq console key |
| `GROQ_MODEL` | ❌ | Default: `llama-3.3-70b-versatile` |
| `AI_DAILY_LIMIT` | ❌ | Default: 100 |
| `SMTP_HOST` | ❌ | Brevo SMTP host |
| `SMTP_USER` | ❌ | Brevo SMTP user |
| `SMTP_PASS` | ❌ | Brevo SMTP password |
| `EMAIL_FROM` | ❌ | Verified sender email |
| `FEATURE_SOCIAL` | ❌ | Default: false |

### Frontend (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_URL` | ✅ | Render backend URL |
| `NEXT_PUBLIC_APP_NAME` | ❌ | Default: OverloadHQ |

---

## Admin Scripts

```bash
# Reset a user's password (when SMTP is not configured)
cd backend
npx tsx scripts/reset-password.ts user@example.com newPassword123

# List registered users
npx tsx scripts/user-count.ts
```

---

## Renaming the App

The app name is stored in a single constant:
- **Backend**: `APP_NAME` in `backend/src/config.ts`
- **Frontend**: `APP_NAME` in `frontend/src/lib/config.ts`
- **Env**: `NEXT_PUBLIC_APP_NAME`
- **PWA**: `frontend/public/manifest.json`

Change all four places to rename.

---

## License

MIT
