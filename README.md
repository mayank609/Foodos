# Foodos

> Google Flights for food delivery — compare prices, fees, and ETAs across Swiggy, Zomato, and restaurant websites in one search.

## Architecture

```
frontend/   Next.js 14 + Tailwind CSS           → Vercel
backend/    Express + TypeScript                → Render (web service)
scrapers/   Playwright API-interception         → Render (worker) or local
database/   Supabase (PostgreSQL) + Upstash Redis
```

## Quick start (local)

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [Upstash Redis](https://upstash.com) database
- A [Firebase](https://firebase.google.com) project (for auth)

### 1. Clone and install
```bash
git clone https://github.com/mayank609/Foodos.git
cd Foodos
npm install          # installs all workspaces
```

### 2. Run database migrations
Open your Supabase project → SQL Editor and run each file in order:
```
database/migrations/001_initial_schema.sql
database/migrations/002_indexes.sql
database/migrations/003_unique_constraints.sql
```

### 3. Configure environment variables

**Backend** — copy and fill in:
```bash
cp backend/.env.example backend/.env
```

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role key |
| `UPSTASH_REDIS_REST_URL` | Upstash console → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash console → REST API |
| `FIREBASE_PROJECT_ID` | Firebase console → Project settings |
| `FIREBASE_CLIENT_EMAIL` | Firebase → Service Accounts → Generate new key |
| `FIREBASE_PRIVATE_KEY` | Same JSON file (include the full `-----BEGIN...` block) |

**Frontend** — copy and fill in:
```bash
cp frontend/.env.local.example frontend/.env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` for local dev |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase console → Project settings → Web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Same |

**Scrapers** — copy and fill in:
```bash
cp scrapers/.env.example scrapers/.env
```

### 4. Run everything
```bash
# Terminal 1 — backend (port 4000)
npm run dev:backend

# Terminal 2 — frontend (port 3000)
npm run dev:frontend

# Terminal 3 — scraper (runs immediately, then every 15 min)
npm run scrape
```

Open [http://localhost:3000](http://localhost:3000).

### Run with Docker Compose
```bash
# Fill in all .env files first, then:
docker-compose up --build
```

---

## Project structure

```
Foodos/
├── PRD.md                        Product Requirements Document
├── vercel.json                   Frontend deployment config
├── render.yaml                   Backend + scraper deployment config
├── docker-compose.yml            Local Docker orchestration
│
├── database/
│   └── migrations/
│       ├── 001_initial_schema.sql    Tables
│       ├── 002_indexes.sql           Search & query indexes
│       └── 003_unique_constraints.sql Upsert constraints + price pruning
│
├── backend/
│   └── src/
│       ├── index.ts              Express app entry point
│       ├── middleware/auth.ts    Firebase token verification
│       ├── routes/
│       │   ├── search.ts         GET /api/search?query=&city=
│       │   ├── favorites.ts      CRUD /api/favorites (auth required)
│       │   └── history.ts        GET /api/history (auth required)
│       ├── services/
│       │   ├── cache.ts          Upstash Redis helpers
│       │   └── database.ts       Supabase queries + recommendation engine
│       └── types/index.ts
│
├── scrapers/
│   └── src/
│       ├── index.ts              Entry point
│       ├── scheduler.ts          15-min interval, loads targets from DB
│       ├── adapters/
│       │   ├── base.ts           Abstract adapter + shared types
│       │   ├── swiggy.ts         Swiggy API interception
│       │   ├── zomato.ts         Zomato API interception
│       │   └── restaurant.ts     Generic restaurant site adapter
│       └── utils/
│           ├── browser.ts        Playwright browser pool
│           └── database.ts       Supabase upsert pipeline
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx           Home / search
        │   ├── search/page.tsx    URL-driven results (/search?q=&city=)
        │   ├── favorites/page.tsx Saved items
        │   └── history/page.tsx   Search history
        ├── components/
        │   ├── ComparisonTable.tsx Platform rows + redirect buttons
        │   ├── RecommendationBadge.tsx Cheapest / Fastest / Best Rated / Best Value
        │   ├── SearchBar.tsx      Debounced input + city selector
        │   ├── Navbar.tsx
        │   ├── AuthProvider.tsx   Firebase auth context
        │   └── AuthButton.tsx     Google sign-in / sign-out
        └── lib/
            ├── api.ts             Backend API client
            ├── firebase.ts        Firebase client init
            └── utils.ts           formatRupees, cn, timeAgo helpers
```

---

## API reference

### `GET /api/search`
| Param | Type | Required | Description |
|---|---|---|---|
| `query` | string | Yes | Food item or restaurant name (min 2 chars) |
| `city` | string | No | Filter by city (e.g. `bangalore`) |

Response includes grouped results with per-platform prices and a `recommendation` object:
```json
{
  "results": [{
    "itemName": "Veg Burger",
    "restaurantName": "Burger King",
    "platforms": [
      { "platform": "Swiggy", "totalPricePaise": 23800, "etaMinutes": 32, ... },
      { "platform": "Zomato", "totalPricePaise": 24900, "etaMinutes": 28, ... }
    ],
    "recommendation": {
      "cheapest": "swiggy",
      "fastest": "zomato",
      "bestRated": "zomato",
      "bestValue": "swiggy"
    }
  }]
}
```

### `GET /api/favorites` · `POST /api/favorites` · `DELETE /api/favorites/:id`
Auth required (Bearer token). Save and retrieve favourite restaurants / items.

### `GET /api/history`
Auth required. Returns last 20 searches for the signed-in user.

---

## Deployment

### Frontend → Vercel
1. Import the repo in Vercel
2. Set **Root Directory** to `frontend`
3. Add environment variables from `frontend/.env.local.example`
4. Deploy

### Backend → Render
1. Create a new **Web Service** pointing to the `backend/` directory
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add all env vars from `backend/.env.example`

### Scrapers → Render (Worker)
1. Create a **Background Worker** using the `scrapers/Dockerfile`
2. Add Supabase env vars + `SCRAPE_CITIES` and `SCRAPE_INTERVAL_MINUTES`

---

## Recommendation scoring

| Badge | Weight | Logic |
|---|---|---|
| 💸 Cheapest | — | Lowest `price + delivery_fee + platform_fee` |
| ⚡ Fastest | — | Lowest ETA in minutes |
| ⭐ Best Rated | — | Highest restaurant rating |
| 🏆 Best Value | Composite | 50% price + 30% speed + 20% rating |

---

## Caching

- Search results are cached in Upstash Redis for **10 minutes**
- The scraper refreshes prices every **15 minutes** (configurable via `SCRAPE_INTERVAL_MINUTES`)
- Cache keys are `search:{query}:{city}` — a cache miss falls back to the latest Supabase rows

---

## Scraper approach

Scrapers use **Playwright network interception** — not HTML/DOM parsing. The browser intercepts internal XHR calls made by Swiggy/Zomato and extracts the structured JSON directly. This is faster, more reliable, and far less fragile than CSS selector-based scraping.

Each platform has an isolated adapter in `scrapers/src/adapters/` that can be updated independently without affecting other adapters.
