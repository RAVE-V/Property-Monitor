# Technology Stack

**Project:** Property Intel
**Researched:** 2025-02-28

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Node.js** | v22 (LTS) | Runtime | 2025 standard; stable `watch` mode and native `WebSocket` support. |
| **Fastify** | v5.x | Web Framework | Superior performance over Express; first-class TypeScript support and built-in JSON Schema validation (Ajv). |
| **TypeScript** | v5.7+ | Language | Type safety for complex property data structures and ROI math. |
| **Zod** | v3.24+ | Schema Validation | Runtime type safety for scraped property data and API requests. |

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **PostgreSQL** | 17.x | Primary Store | Reliable, transactional, and handles complex JSONB listing data. |
| **PostGIS** | 3.5.x | Spatial Engine | Necessary for "hotspot" radius searches and map tile generation. |
| **Redis** | 7.x | Queue/Cache | High-performance backing for BullMQ; handles rapid scraper state transitions. |
| **Drizzle ORM**| v0.39+ | Database Access | Lightweight, TypeScript-first, and superior to Prisma for complex spatial queries. |

### Visualization (Map)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **MapLibre GL JS**| v5.19+ | Map Engine | Open-source (BSD), no per-load pricing, and supports **WebGPU** for 60fps performance on 10k+ markers. |
| **PMTiles** | v3.x | Map Hosting | Serverless vector tile format; allows hosting map tiles on S3 without a dedicated tile server. |
| **Tailwind CSS** | v4.x | Styling | Modern, utility-first CSS for the interactive dashboard. |

### Scraping & Intelligence
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Playwright** | 1.50+ | Browser Automation| Leading automation library with excellent debugging and container support. |
| **Camoufox-js** | v0.4+ | Stealth Browser | Patches Firefox at C++ layer; bypasses JA4/TLS fingerprinting that blocks standard Playwright. |
| **Crawlee JS** | v3.16+ | Scraper Runner | Handles retries, request management, and fingerprint rotation automatically. |
| **BullMQ** | v5.x | Task Orchestration| Reliable job queue for handling async scraping and enrichment flows. |

### Infrastructure & CI/CD
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Docker** | 2025 Standard| Containerization | Ensures "scrape-on-my-machine" consistency in production. |
| **KEDA** | v2.x | Worker Scaling | Scales BullMQ scraper workers to zero when no jobs are pending; essential for cost control. |
| **GitHub Actions**| — | CI/CD | Native Playwright sharding support for parallelized scraper testing. |

## Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **camoufox-js** | 0.4.x | TLS Bypass | Use for ALL UK portals (Zoopla/OpenRent) to avoid Cloudflare blocks. |
| **Bright Data** | — | Residential Proxy| Use with `geoip: true` in Camoufox to match Timezone/Locale. |
| **2Captcha** | — | Captcha Solver | Fallback for Turnstile/hCaptcha on high-security portals. |
| **Big.js** | — | ROI Calculations | Use for all VAT/Profit math to avoid floating point errors. |

## Specialized Calculation Logic (UK SA)

### VAT: TOMS (Tour Operators Margin Scheme)
For Rent-to-Rent (R2R) models, the **TOMS** logic is mandatory for competitive pricing:
- **Margin:** `Total Revenue - Direct Costs (Rent, Utilities, Bills)`
- **VAT Due:** `Margin / 6` (Treats margin as VAT-inclusive at 20%)
- **Rationale:** Standard 20% VAT on *gross revenue* destroys R2R margins. TOMS allows staying under the threshold longer and paying less once registered.

### Hotspot Detection
- **Source:** AirDNA / AirROI API.
- **Metric:** `Occupancy % * Average Daily Rate (ADR) * 0.7 (Conservative Factor)`.
- **Clustering:** Use **Supercluster** (integrated in MapLibre) for real-time marker grouping.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Map Engine** | MapLibre GL JS | Mapbox GL JS | Mapbox per-load pricing is prohibitive for high-traffic property tools. |
| **Backend** | Fastify | Express | Fastify's native schema validation and modern async handling are superior for 2025. |
| **ORM** | Drizzle | Prisma | Drizzle handles PostGIS/Spatial types better and has lower overhead. |
| **Scraper** | Camoufox | Puppeteer Stealth| Puppeteer Stealth is easily detected by modern JA4/TLS fingerprinting. |

## Installation

```bash
# Core Backend
npm install fastify @fastify/cors @fastify/autoload zod drizzle-orm pg bullmq

# Scraping Stack
npm install playwright-core camoufox-js crawlee
npx camoufox-js fetch

# Frontend
npm install maplibre-gl @maplibre/maplibre-gl-geocoder big.js
```

## Sources

- [MapLibre v5 Release Notes](https://maplibre.org/news/2025-01-20-maplibre-gl-js-v5/)
- [Camoufox Documentation (2025 Stealth Best Practices)](https://camoufox.com/docs/)
- [HMRC VAT Notice 709/5: Tour Operators Margin Scheme](https://www.gov.uk/guidance/tour-operators-margin-scheme-for-vat-notice-7095)
- [Crawlee JS v3.x Docs](https://crawlee.dev/docs/3.16/)
- [BullMQ v5 Task Management Patterns](https://docs.bullmq.io/)

---
**Confidence Assessment:**
- **Core Stack:** HIGH (Standard 2025 Node/Postgres patterns)
- **Scraping Stealth:** MEDIUM (Camoufox is highly effective but anti-bot measures evolve weekly)
- **VAT Logic:** HIGH (TOMS is the industry standard for UK SA/R2R)
- **Map Scaling:** HIGH (MapLibre v5 + WebGPU is verified for high-density markers)
