# Domain Pitfalls: Property Intel

**Domain:** UK Property Tech (Rent-to-Rent, SA/HMO)
**Researched:** 2025-02-28
**Confidence:** HIGH (Based on 2024/2025 regulatory updates and industry-standard scraping/mapping patterns)

## Critical Pitfalls

### Pitfall 1: Portal Hostility & "Naive" Scraping

**What goes wrong:**
Initial scraping scripts for Rightmove, Zoopla, and SpareRoom work in development but are permanently blacklisted within minutes of production deployment. Users see "No Data" or the application crashes.

**Why it happens:**
Major UK portals use Akamai Bot Manager and TLS (JA3) fingerprinting. They detect non-browser headers and "inhuman" request patterns (perfectly timed intervals, lack of mouse telemetry) and issue 403 Forbidden or persistent CAPTCHAs.

**How to avoid:**
Use `curl-impersonate` or `uTLS` to match browser cryptographic signatures. Implement rotating residential proxies (ISP-backed, not data centers). Use "grid scraping" (zooming into micro-neighborhoods) to bypass search result limits (typically 1,000).

**Warning signs:**
Sudden 403 errors, mandatory 2FA prompts on public pages, or being served "shadow-banned" content (empty results that look successful).

**Phase to address:**
Phase 1 (Data Ingestion Engine)

---

### Pitfall 2: Regulatory Blindness (HMO Article 4 & Thresholds)

**What goes wrong:**
The tool identifies a "high profit" HMO opportunity, but the investor's planning application is rejected because the council has an Article 4 direction or a "threshold" rule (e.g., no more than 10% HMOs in a 50m radius).

**Why it happens:**
HMO licensing (the right to rent to 3+ people) is different from HMO planning (the right to change use from C3 to C4). Many proptech tools show licensing data but ignore planning constraints, which are often buried in council PDFs.

**How to avoid:**
Ingest the DLUHC Planning Data Platform (Beta) for Article 4 polygons. Implement a "Radius Threshold" calculator that counts existing HMOs within a 50m/100m radius of a target property.

**Warning signs:**
High density of licensed HMOs in an area that is suddenly rejecting all new applications.

**Phase to address:**
Phase 2 (Hotspot Detection & Analysis)

---

### Pitfall 3: Inaccurate ROI (The "FHL & Section 24" Trap)

**What goes wrong:**
Calculated ROI looks attractive (25%+), but the actual net profit is negative after tax and compliance costs.

**Why it happens:**
The Furnished Holiday Let (FHL) tax regime was abolished in April 2025. Many investors (and tools) still calculate based on old mortgage interest relief rules. Additionally, R2R operators often forget "Decent Homes Standard" compliance costs (mandatory as of 2025).

**How to avoid:**
Update profit calculators to reflect the 2025 tax changes (restricted interest relief for individuals). Include mandatory line items for "Compliance Fund" (Fire/Safety) and "Utility Volatility" (especially for HMOs).

**Warning signs:**
Users complaining that "the numbers don't match my accountant's."

**Phase to address:**
Phase 3 (Automated Profit Calculator)

---

### Pitfall 4: Map Rendering Bottleneck (DOM Overload)

**What goes wrong:**
The map interface becomes laggy or crashes the browser when displaying more than 500-1,000 individual property markers.

**Why it happens:**
Using standard `Marker` classes in Leaflet or Mapbox creates individual DOM elements. Browsers struggle to animate or handle events for thousands of DOM nodes simultaneously.

**How to avoid:**
Use WebGL-based rendering (MapLibre GL JS or Mapbox GL JS). Use `circle` or `symbol` layers instead of `Marker` objects. Implement clustering for low zoom levels and "Point-in-Polygon" filtering on the backend to only send visible data.

**Warning signs:**
Chrome Task Manager showing high GPU/Memory usage; "stuttering" when zooming or panning.

**Phase to address:**
Phase 1 (Core Map Interface)

---

### Pitfall 5: GDPR "Invisible Processing" (Landlord Data)

**What goes wrong:**
The project receives a "Letter Before Action" from a landlord or an ICO investigation notice for "scraping and processing personal data without a lawful basis."

**Why it happens:**
Scraping landlord names and contact details from OpenRent/SpareRoom for "lead gen" is considered "invisible processing" under UK GDPR. If you don't have a Data Protection Impact Assessment (DPIA) or a clear "Legitimate Interest" justification, you are non-compliant.

**How to avoid:**
Conduct a DPIA before launch. Do not store PII (names/phone numbers) longer than necessary. Provide a clear "Opt-Out/Right to Erasure" mechanism for property owners discovered through the tool.

**Warning signs:**
High volume of "How did you get my data?" emails.

**Phase to address:**
Phase 1 (Data Ingestion & Storage)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| **Headless Browser Scraping** | Fast to build (Puppeteer/Playwright). | High compute cost; easily detected by Akamai/Cloudflare. | Prototype/Validation only. |
| **Radius-only Hotspots** | Simple math; no council boundary data needed. | Massive inaccuracy in Article 4 zones (where streets are split). | Phase 1 (Alpha testing). |
| **GeoJSON Flat Files** | No spatial database (PostGIS) needed. | Slow spatial queries as dataset grows; no easy "nearest neighbor" lookups. | Under 5,000 properties. |
| **Manual Data Refresh** | No complex scheduler/worker pool. | Stale listing data leads to user frustration; "Dead links." | Never - stale data kills Proptech. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Airbnb API** | Assuming "Unavailable" = "Booked". | Use the "San Francisco Model": (Reviews / 0.5) * Stay Length. |
| **Zoopla/Rightmove** | Scraping the "Search Results" only. | Scrape the "Property Detail" page to get full feature lists and UPRNs. |
| **SpareRoom** | Ignoring "Early Bird" listings. | Authenticate scraper as a user to access 7-day exclusive listings (high value). |
| **Planning Data** | Relying on Council PDFs. | Use DLUHC Planning Data API or commercial aggregators (Searchland). |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Client-side Clustering** | Freeze on map load. | Server-side clustering (e.g., using `supercluster` on Node). | > 10,000 points |
| **N+1 Property Lookups** | Slow list views/popups. | Eager load related data (ROI/Analytics) in a single query. | > 50 simultaneous users |
| **Raw GeoJSON Transfer** | Massive 20MB+ initial page load. | Use Vector Tiles (MVT) or PMTiles to stream only visible data. | > 50,000 points |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Storing Exact Coordinates** | Privacy breach for residential owners. | Store exact coords for math; "jitter" or fuzz the map display coords for users. |
| **Public API Endpoints** | Competitors scraping your aggregated/cleaned data. | Implement strict Rate Limiting and JWT-based authentication for map data. |
| **Insecure Scraper Proxy** | Leaking your server's true IP. | Use "Proxy Chaining" and verify `X-Forwarded-For` headers are stripped. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **"Marker Soup"** | Overwhelming visual clutter. | Heatmaps for density; Cluster markers for count. |
| **Stale ROI Data** | User loses money on a bad deal. | Add "Last Updated" timestamps and "Live Check" buttons for ROI cards. |
| **Hidden Calculation Logic** | Lack of trust in "Automated Profit." | Provide a "View Breakdown" modal showing exactly how ROI was calculated. |

## "Looks Done But Isn't" Checklist

- [ ] **Data Scraping:** Often missing **IP rotation** — verify it doesn't get blocked after 100 requests.
- [ ] **Hotspot Analysis:** Often missing **Article 4 data** — verify it doesn't recommend restricted zones.
- [ ] **Profit Calculator:** Often missing **Utilities/Voids** — verify it includes 10% void and £150-300 bills (for HMO).
- [ ] **Map Interface:** Often missing **Mobile Responsiveness** — verify map is usable on small screens.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Blocked Scraper** | MEDIUM | Switch to residential proxy provider; implement `curl-impersonate`. |
| **Stale Article 4 Data** | HIGH | Manual audit of council planning pages; move to a paid planning data API. |
| **Map Performance Crash** | MEDIUM | Rewrite marker logic from `Marker` (DOM) to `Circle` (WebGL). |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| **Scraper Blocking** | Phase 1 | Successful scrape of 500+ items without 403s. |
| **Article 4 Errors** | Phase 2 | Manual spot-check of 5 known Article 4 zones in different councils. |
| **Tax/ROI Inaccuracy** | Phase 3 | Comparison against manual spreadsheet calculations for 3 property types. |
| **Map Lag** | Phase 1 | Stress test with 10,000 mock points at 60fps. |

## Sources

- [DLUHC Planning Data Platform](https://planning.data.gov.uk/) (Official Source)
- [InsideAirbnb: San Francisco Model](http://insideairbnb.com/about/) (Industry Practice)
- [UK Government: Abolition of Furnished Holiday Lettings (FHL)](https://www.gov.uk/government/publications/abolition-of-the-furnished-holiday-lettings-tax-regime) (Regulatory Source)
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/api/) (Technical Source)
- [ICO: Legitimate Interests Assessment](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/legitimate-interests/) (Compliance Source)

---
*Pitfalls research for: Property Intel*
*Researched: 2025-02-28*
