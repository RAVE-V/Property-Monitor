# Architecture Research: Property Intel

**Domain:** Property Intelligence & Map-Based Investment Analysis
**Researched:** 2025-02-28
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Visualization Layer                    │
│             (Next.js + Mapbox GL JS + Tailwind)             │
├───────────────────────────────┬─────────────────────────────┤
│                               │                             │
│       ┌───────────────┐       │       ┌───────────────┐     │
│       │ Property Map  │ <──── API ───> │ Profit Calc   │     │
│       └───────────────┘       │       └───────────────┘     │
│                               │                             │
├───────────────────────────────┴─────────────────────────────┤
│                       Orchestration Layer                    │
│                (NestJS/Fastify + BullMQ + Redis)            │
├───────────────────────────────┬─────────────────────────────┤
│                               │                             │
│    ┌───────────────┐    ┌─────┴─────┐    ┌───────────────┐  │
│    │ Scraper Pool  │    │ AirDNA API│    │ Profit Engine │  │
│    └───────┬───────┘    └─────┬─────┘    └───────┬───────┘  │
│            │                  │                  │          │
├────────────┴──────────────────┴──────────────────┴──────────┤
│                       Persistence Layer                     │
│               (PostgreSQL + PostGIS + S3)                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Frontend Map** | Interactive visualization of hotspots and properties. | React + Mapbox GL JS (Vector Tiles) |
| **API Gateway** | Auth, property search, and manual profit triggers. | Next.js API Routes or Fastify |
| **Task Queue** | Manages scraper jobs, retries, and rate limits. | BullMQ + Redis |
| **Scraper Workers**| Headless browsers for UK property portals. | Crawlee + Playwright (Camoufox) |
| **Demand Service** | Fetches STR occupancy data for postcodes. | AirDNA or AirROI API |
| **Profit Engine**  | Calculates ROI/Net Profit using UK R2R formulas. | Node.js Service (Zod validation) |
| **Spatial DB** | Stores listings with lat/lng for radius searches. | PostgreSQL + PostGIS |
| **Raw Storage** | Stores raw HTML/JSON for audit/debugging. | AWS S3 or MinIO |

## Recommended Project Structure

```
src/
├── apps/
│   ├── web/                # Next.js Frontend
│   └── api/                # Backend API (Fastify/NestJS)
├── libs/
│   ├── scrapers/           # Crawlee-based scraping logic
│   │   ├── zoopla/
│   │   ├── openrent/
│   │   └── spareroom/
│   ├── intelligence/       # Profit calculation & hotspot logic
│   ├── database/           # Prisma/Drizzle schemas & migrations
│   └── shared/             # Types, Zod schemas, UK R2R constants
├── workers/                # BullMQ worker implementations
└── docker/                 # Container configs (Redis, PostGIS)
```

### Structure Rationale

- **apps/web/:** Separates the heavy Mapbox client logic from the backend.
- **libs/scrapers/:** Each portal has unique anti-bot and DOM structure; needs isolated logic.
- **libs/intelligence/:** Centralizes the "business math" (ROI, Net Profit) so it can be used by both real-time API and background workers.
- **workers/:** Scalable compute units that can be deployed independently of the API.

## Architectural Patterns

### Pattern 1: Asynchronous Ingestion (Worker Pattern)

**What:** Decoupling the discovery of properties from the enrichment (profit calculation).
**When to use:** Essential for property intelligence where data comes from multiple slow sources (Scrapers + 3rd party APIs).
**Trade-offs:** 
- **Pros:** Resilient to scraper failures; easy to scale workers.
- **Cons:** Data is "eventually consistent" on the map.

**Example:**
```typescript
// BullMQ Job flow
const flow = new FlowProducer();
await flow.add({
  name: 'enrich-property',
  queueName: 'intelligence',
  children: [
    { name: 'scrape-zoopla', queueName: 'scrapers', data: { url } },
    { name: 'fetch-airdna', queueName: 'demand', data: { postcode } }
  ]
});
```

### Pattern 2: Geo-Heatmap Rendering (Vector Tiles)

**What:** Using Mapbox Vector Tiles (MVT) to render thousands of property markers and density heatmaps efficiently.
**When to use:** When the "hotspot" view needs to show thousands of data points at once.
**Trade-offs:** 
- **Pros:** 60fps performance; client-side filtering (e.g., "Show ROI > 30%").
- **Cons:** Requires a tile-server or PostGIS MVT generation logic.

### Pattern 3: Proxy Chain with Stealth Fingerprinting

**What:** Using `Camoufox` (hardened Firefox) combined with rotating residential proxies.
**When to use:** Mandatory for Zoopla/Rightmove in 2025 to bypass Cloudflare/Akamai.
**Trade-offs:** 
- **Pros:** High success rate; avoids IP bans.
- **Cons:** High cost (residential proxies are expensive).

## Data Flow

### Request Flow (User Search)

```
[User Pans Map]
    ↓
[Frontend] → [API: /properties?bbox=...] → [PostGIS: ST_MakeEnvelope]
    ↓              ↓           ↓            ↓
[Mapbox Render] ← [JSON] ← [GeoJSON Transform] ← [Database]
```

### Key Data Flows

1. **Ingestion Flow:** `Discovery Worker` (finds URLs) → `Scraper Worker` (extracts DOM) → `Persistence` (PostgreSQL) → `Enrichment Worker` (Profit Calc) → `Notification` (Frontend Socket).
2. **Profit Recalculation:** `User Input` (Change Bills/Rent) → `API` → `Profit Service` → `Immediate Response` + `Persistence Update`.

## Build Order & Dependencies

### Phase 1: Data Foundation (Weeks 1-2)
1. **Infrastructure:** Docker setup for PostGIS, Redis.
2. **Persistence:** Schema definition for properties, postcodes, and demand data.
3. **Core Scraper:** Build ONE basic scraper (OpenRent) to get live data.

### Phase 2: Intelligence & Map (Weeks 3-4)
1. **Profit Engine:** Implement the math library (ROI, Net Profit).
2. **Map MVP:** Mapbox integration with basic property markers.
3. **Demand Integration:** Connect AirDNA/AirROI API to enrich scraped properties.

### Phase 3: Scaling & Portals (Weeks 5-6)
1. **BullMQ:** Move scrapers to background workers.
2. **Stealth Scrapers:** Implement Zoopla/SpareRoom with residential proxies.
3. **Heatmaps:** Add the hotspot density layer to the map.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k properties | Single SQLite/Postgres; synchronous scrapers. |
| 1k-100k properties | PostGIS with GIST indexes; BullMQ workers; S3 for raw data. |
| 1M+ properties | Vector Tile Server (Tipg/Martin); DB Partitioning by UK Region. |

### Scaling Priorities

1. **First bottleneck:** Scraper blocking (IP bans). **Fix:** Integrate Residential Proxies immediately.
2. **Second bottleneck:** Map lag with 10k+ markers. **Fix:** Move to Mapbox Clusters or Vector Tiles.

## Anti-Patterns

### Anti-Pattern 1: Scraping Airbnb Directly
**What people do:** Write custom scrapers for Airbnb/Booking.com.
**Why it's wrong:** Extremely high maintenance; frequent IP blocks; data is often incomplete (doesn't show occupancy accurately).
**Do this instead:** Use **AirDNA** or **AirROI** APIs. The cost of the API is lower than the engineering cost of maintaining scrapers.

### Anti-Pattern 2: Global "Bills" Constant
**What people do:** Using a single "£200/mo" bills estimate for all properties.
**Why it's wrong:** UK Council Tax bands and utility costs vary wildly by region and property type.
**Do this instead:** Implement a lookup table for Council Tax bands by postcode and a room-based utility formula (£50-£70/room).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **AirROI API** | REST API (JSON) | Primary source for STR demand and occupancy. |
| **Bright Data** | HTTP Proxy Tunnel | Residential proxies for scraping Zoopla/OpenRent. |
| **Mapbox GL** | Vector Tile Client | Map visualization and heatmap layer. |
| **2Captcha** | API | Fallback for solving Turnstile/HCaptcha on Zoopla. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| API ↔ Workers | BullMQ / Redis | Asynchronous job dispatching. |
| Workers ↔ DB | Drizzle/Prisma (Direct) | Shared DB connection pool. |
| Frontend ↔ API | HTTP / WebSockets | Sockets used for "Scrape Complete" updates. |

## Sources

- [Crawlee Documentation (2025)](https://crawlee.dev/)
- [PostGIS Spatial Indexing Best Practices](https://postgis.net/workshops/postgis-intro/indexing.html)
- [UK R2R Tax & Compliance Updates 2024/2025](https://www.gov.uk/guidance/vat-on-serviced-accommodation)
- [Mapbox GL JS Performance Guide](https://docs.mapbox.com/mapbox-gl-js/guides/)

---
*Architecture research for: Property Intel*
*Researched: 2025-02-28*
