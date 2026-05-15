# Food Delivery Comparison & Smart Redirect Platform — PRD

## 1. Product Overview

### Vision

A platform where users can search food items across multiple delivery services, compare prices, delivery fees, offers, and ETAs, then redirect seamlessly to the chosen platform.

**Positioning:** "Google Flights for food delivery"

**Initial supported platforms:**
- Swiggy
- Zomato
- Restaurant websites

---

## 2. Problem Statement

### User Pain Points
| Problem | Impact |
|---|---|
| Open multiple delivery apps to compare | Time-wasting |
| Manual price comparison | Error-prone, tedious |
| Repeated searches across platforms | Friction-heavy UX |
| Missed discounts and better deals | Financial loss |
| Inefficient ordering workflow | Poor experience |

### What This Platform Solves
- Fragmented food discovery
- Hidden pricing differences
- Poor comparison experience
- Inefficient ordering workflow

---

## 3. Target Users

### Primary Users
- College students
- Working professionals
- Frequent food delivery users
- Budget-conscious customers

### Secondary Users
- Fitness-focused users (tracking macros/spend)
- Group ordering users
- Food explorers

---

## 4. Core Features (MVP)

### 4.1 Unified Search

Users can search by:
- Food item (e.g. "Paneer Burger", "Chicken Biryani")
- Restaurant name (e.g. "Domino's Pizza")
- Cuisine type

The app fetches results from Swiggy, Zomato, and restaurant websites simultaneously.

---

### 4.2 Price Comparison

Display a side-by-side breakdown for each result:

| Platform | Item Price | Delivery Fee | Taxes/Fees | ETA | Rating | Offers | **Final Price** |
|---|---|---|---|---|---|---|---|
| Swiggy | ₹199 | ₹39 | — | 30 mins | 4.2 | — | **₹238** |
| Zomato | ₹189 | ₹49 | — | 28 mins | 4.4 | — | **₹238** |

Fields shown per listing:
- Item price
- Delivery fee
- Taxes / platform fees
- Estimated delivery time
- Restaurant rating
- Active offers / coupons

---

### 4.3 Smart Recommendation

The system automatically highlights:
- **Cheapest option** — lowest final price
- **Fastest delivery** — lowest ETA
- **Best rated** — highest restaurant rating
- **Best value** — composite score across price, ETA, and rating

---

### 4.4 Redirect Ordering

Users are redirected to the chosen platform via deep link:
- Swiggy app / website
- Zomato app / website
- Restaurant's own website

**MVP does NOT handle:**
- Payments
- Logistics management
- Live delivery tracking

This keeps operational complexity low at launch.

---

### 4.5 Search History & Favorites

Users can:
- Save favourite restaurants
- Save favourite items
- View and re-run recent searches

---

## 5. Future Features (Post-MVP)

| Feature | Description |
|---|---|
| AI Recommendation Engine | "Best meal under ₹200", "High-protein meals nearby", "Cheapest pizza combo" |
| Personalized Recommendations | Based on order history, budget, cuisine preferences |
| Offer Prediction & Alerts | Notify users when prices drop, coupons appear, or delivery becomes free |
| Grocery & Quick Commerce | Integrate Blinkit, Zepto, Instamart |

---

## 6. Technical Architecture

### High-Level Flow

```
User App
  ↓
Frontend (Next.js)  →  Vercel
  ↓
Backend API (Node.js / Express)  →  Render
  ↓
Supabase (PostgreSQL) + Upstash Redis
  ↓
Playwright Scrapers (API interception)
  ↓
Swiggy / Zomato / Restaurant APIs
```

---

### 6.1 Tech Stack

#### Frontend
| Choice | Rationale |
|---|---|
| Next.js | Fast development, Vercel deployment, built-in API routes, SSR/SEO |
| Tailwind CSS | Utility-first, rapid UI iteration |
| ShadCN UI | Accessible, composable component library |

#### Backend
| Choice | Rationale |
|---|---|
| Node.js + Express | Lightweight, async-first, large ecosystem |
| Search orchestration | Fans out queries to scrapers, normalizes results |
| Authentication middleware | Validates Firebase tokens |
| Cache management | Redis-first lookup before hitting DB |

#### Database
| Choice | Rationale |
|---|---|
| Supabase (PostgreSQL) | Relational schema, good querying, free tier |
| Upstash Redis | Low-latency cache for search results and menus |

#### Auth
| Choice | Rationale |
|---|---|
| Firebase Authentication | Google Login, Phone Login, managed session handling |

---

### 6.2 Scraping Infrastructure

**Core tool:** Playwright (browser automation)

**Key principle:** The system does **not** rely on HTML/DOM scraping. It intercepts internal XHR/fetch API calls and extracts structured JSON responses. This is:
- Faster
- More reliable
- Less fragile than DOM parsing

**Scraper flow:**
1. Playwright opens the target platform in a headless browser
2. Network interceptors capture internal API calls
3. JSON payloads are extracted
4. Data is normalized into a common schema
5. Normalized records are stored in Supabase

**Platform Adapter Structure:**
```
/adapters
  swiggy.js       # Swiggy-specific API interception logic
  zomato.js       # Zomato-specific API interception logic
  restaurant.js   # Generic restaurant website adapter
```

Each adapter:
- Understands the platform's internal API shape
- Extracts required fields
- Transforms data into the common format

**Common Data Format:**
```json
{
  "restaurant": "Burger King",
  "platform": "swiggy",
  "item": "Veg Burger",
  "price": 129,
  "delivery_fee": 39,
  "eta_minutes": 32,
  "rating": 4.3,
  "offers": ["20% off on orders above ₹299"],
  "scraped_at": "2026-05-15T10:00:00Z"
}
```

---

## 7. Database Design

### Tables

#### `restaurants`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | TEXT | Restaurant name |
| location | TEXT/JSONB | City, lat/lng |
| rating | FLOAT | Aggregate rating |
| created_at | TIMESTAMP | |

#### `platforms`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | TEXT | e.g. "Swiggy", "Zomato" |
| base_url | TEXT | Deep link base |

#### `menu_items`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| restaurant_id | UUID | FK → restaurants |
| name | TEXT | Original item name |
| normalized_name | TEXT | For fuzzy matching |
| category | TEXT | e.g. "Burger", "Biryani" |

#### `prices`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| menu_item_id | UUID | FK → menu_items |
| platform_id | UUID | FK → platforms |
| price | INTEGER | In paise or rupees |
| delivery_fee | INTEGER | |
| eta_minutes | INTEGER | |
| scraped_at | TIMESTAMP | Freshness tracking |

#### `offers`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| platform_id | UUID | FK → platforms |
| restaurant_id | UUID | FK → restaurants |
| description | TEXT | Coupon / cashback text |
| valid_until | TIMESTAMP | |

#### `search_history`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | TEXT | Firebase UID |
| query | TEXT | Search string |
| searched_at | TIMESTAMP | |

---

## 8. Search & Caching Flow

### User Journey

```
1. User searches "Paneer Burger"
2. Backend checks Redis cache for query
3a. Cache HIT  → return cached results immediately
3b. Cache MISS → query Supabase for latest stored data
4. Results normalized and ranked
5. Frontend renders comparison table with recommendation badges
6. User clicks platform redirect button
7. Deep link opens Swiggy / Zomato / restaurant site
```

### Caching Strategy

**Core principle:** The platform does **not** run live scrapes on every user request.

Instead:
- Scrapers run on a **scheduled interval** (every 10–15 minutes)
- Popular restaurants and trending items are pre-fetched
- Results are cached in Redis with a TTL matching the scrape interval
- Cold queries fall back to the most recent Supabase record

**Scheduler targets (MVP):**
- Top 20–50 restaurants per supported city
- Items trending in the past 24 hours
- Any restaurant with an active offer

---

## 9. Deployment Strategy

| Layer | MVP Host | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploy on push |
| Backend API | Render | Free tier sufficient for MVP |
| Database | Supabase | Managed PostgreSQL |
| Cache | Upstash Redis | Serverless Redis |
| Scrapers | Local laptop / PC | Migrate to VPS post-MVP |
| VPS (future) | Hetzner / Contabo | Cost-effective scaling |

---

## 10. Scaling Roadmap

| Stage | Scope | Infrastructure |
|---|---|---|
| MVP | 1 city, 20–50 restaurants, 2 platforms | Single backend, scheduled scraper |
| Growth | Multiple cities, more restaurants, higher update frequency | Horizontal backend scaling |
| Scale | Distributed scrapers, queue systems, proxy rotation, AI recommendations | Full microservices + ML pipeline |

---

## 11. Security & Legal Considerations

### Risks
- Platform API changes breaking scrapers
- Anti-bot systems and IP blocking
- Legal notices from platforms

### Mitigations
| Risk | Mitigation |
|---|---|
| API changes | Modular adapters — update one without breaking others |
| Anti-bot | Low-frequency scraping, cached results, rate limiting |
| IP blocking | Proxy rotation (scale stage), respectful crawl rates |
| Legal | Eventual partnership / affiliate agreements; no unauthorized data resale |

---

## 12. MVP Scope

### In Scope
- Unified food search
- Price & delivery comparison table
- Smart recommendation badges (cheapest, fastest, best rated, best value)
- Platform redirect (deep links)
- Cached pricing data
- Restaurant listing
- User authentication (Google + Phone)
- Search history & favourites

### Out of Scope (MVP)
- Payment processing
- Delivery management
- Live order tracking
- Wallet system
- Subscription / premium tier

---

## 13. Success Metrics

### Product Metrics
| Metric | Description |
|---|---|
| Daily Active Users (DAU) | Engagement baseline |
| Searches per user | Feature utilization |
| Redirect click-through rate (CTR) | Core conversion metric |
| Session duration | Stickiness |
| Average saved amount per user | Value demonstration |

### Technical Metrics
| Metric | Target (MVP) |
|---|---|
| Scraper success rate | > 95% |
| API response time (p95) | < 500 ms |
| Cache hit rate | > 80% |
| Data freshness | < 15 min staleness |
