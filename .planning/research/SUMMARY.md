# Project Research Summary

**Project:** Property Intel
**Domain:** UK Property Intelligence (Rent-to-Rent, SA, HMO)
**Researched:** 2025-02-28
**Confidence:** HIGH

## Executive Summary

Property Intel is a specialized real estate intelligence platform designed for UK investors focusing on Rent-to-Rent (R2R), Serviced Accommodation (SA), and Houses in Multiple Occupation (HMO). Experts build such systems by combining high-frequency web scraping of property portals (Zoopla, OpenRent, SpareRoom) with geospatial analysis and automated financial modeling. The core value lies in identifying "motivated seller" signals (e.g., "Tired Landlord" indicators) and overlaying complex regulatory data (Article 4 directions, HMO licensing) onto an interactive map to provide instant "Deal or No Deal" clarity.

The recommended approach centers on a high-performance, spatial-first architecture using Fastify and PostgreSQL/PostGIS. Visualization is handled via MapLibre GL JS with WebGPU support to manage the rendering of thousands of property markers without performance degradation. Data ingestion must be decoupled using a robust task queue (BullMQ) and stealth-focused scraping tools (Camoufox/Playwright) to bypass aggressive anti-bot measures common on UK property portals. Financial logic must strictly adhere to the 2025 UK tax updates, specifically the abolition of the FHL regime and the application of TOMS VAT logic for R2R operators.

Key risks include rapid evolution of anti-scraping technologies, fragmented and often PDF-bound council regulatory data (Article 4), and potential GDPR "invisible processing" issues when handling landlord data. These are mitigated by using hardened stealth browsers (Camoufox), integrating specialized planning data APIs (DLUHC), and implementing strict PII handling policies with clear opt-out mechanisms.

## Key Findings

### Recommended Stack

The stack focuses on performance, scalability, and stealth. Node.js with Fastify provides a high-concurrency backend, while PostGIS handles the critical spatial queries for radius-based "hotspot" detection. MapLibre GL JS (v5+) is chosen for the frontend to ensure 60fps performance with large datasets without the per-load costs of Mapbox.

**Core technologies:**
- **Fastify (v5.x):** Backend API — Superior performance and native JSON Schema validation for property data.
- **PostGIS (3.5.x):** Spatial Database — Necessary for radius searches and map tile generation.
- **Camoufox (v0.4+):** Stealth Scraper — Essential for bypassing JA4/TLS fingerprinting on UK portals.
- **MapLibre GL JS (v5.19+):** Map Engine — Open-source, high-performance rendering using WebGPU.

### Expected Features

The product must transition from a basic listing aggregator to an intelligent sourcing tool focusing on compliance and ROI.

**Must have (table stakes):**
- **Interactive Map Interface** — Core visualization of hotspots and listings with 60fps performance.
- **Portal Data Ingestion** — Live listings from Zoopla, OpenRent, and SpareRoom using stealth scrapers.
- **Automated Profit Calculator** — Instant ROI/Yield based on R2R/SA strategies and 2025 tax rules.

**Should have (competitive):**
- **"Tired Landlord" Intel** — Flagging properties with price drops or long time-on-market.
- **Compliance Overlays** — Article 4 and C5 Use Class boundaries integrated into the map.
- **Demand Heatmaps** — Visualizing STR occupancy and worker/tourist proximity.

**Defer (v2+):**
- **Booking Management (PMS)** — High complexity, better served by integrations.
- **Financing/Mortgage Brokerage** — Regulated space, better as a referral partnership.

### Architecture Approach

A distributed worker-based architecture is recommended to handle the asynchronous nature of property scraping and enrichment.

**Major components:**
1. **Scraper Workers (Crawlee/Playwright)** — Independent units for extracting data from various portals using stealth fingerprints.
2. **Task Queue (BullMQ/Redis)** — Orchestrates ingestion, enrichment, and retries with KEDA scaling.
3. **Intelligence Engine** — Centralized service for ROI calculations, TOMS VAT logic, and "hotspot" scoring.
4. **Spatial DB (PostGIS)** — High-performance storage for all geospatial property data and MVT generation.

### Critical Pitfalls

1. **Portal Hostility** — Standard scrapers get blocked instantly. Use `Camoufox` and residential proxies to match browser signatures.
2. **Regulatory Blindness** — Ignoring Article 4 directions leads to bad investments. Ingest DLUHC planning data directly.
3. **Inaccurate ROI** — Outdated tax math (e.g., FHL) destroys trust. Use 2025-compliant math and include "Decent Homes" compliance costs.
4. **Map Rendering Lag** — Thousands of DOM markers crash browsers. Use WebGL/WebGPU-based symbol layers in MapLibre.
5. **GDPR "Invisible Processing"** — Scraping landlord PII without a basis. Conduct a DPIA and provide clear opt-out mechanisms.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Data & Map Foundation
**Rationale:** Establishing the data pipeline and high-performance visualization layer is the biggest technical risk.
**Delivers:** A functional map showing scraped listings from one portal (OpenRent) with basic filtering and PostGIS backend.
**Addresses:** Interactive Map Interface, Portal Data Ingestion, Basic Property Filters.
**Avoids:** Map Rendering Bottleneck (Pitfall 4) by using WebGL-based MapLibre from the start.

### Phase 2: Intelligence & Compliance
**Rationale:** Adds the unique value proposition (compliance and profit math) on top of the foundation.
**Delivers:** Article 4 overlays, the Automated Profit Calculator (2025 tax-compliant), and Market Comparables.
**Uses:** Drizzle ORM for spatial queries and Big.js for precision financial math.
**Implements:** Intelligence Engine and Compliance Overlays.

### Phase 3: Stealth Scaling & Automation
**Rationale:** Expands data sources to more hostile portals and adds professional sourcing/outreach tools.
**Delivers:** Zoopla/SpareRoom integration, Tired Landlord flags, and Direct-to-Vendor (DTV) actions via Stannp.
**Addresses:** "Tired Landlord" Intel, Demand Heatmaps, DTV Integration.
**Avoids:** Portal Hostility (Pitfall 1) through advanced residential proxy and stealth fingerprinting implementation.

### Phase Ordering Rationale

The order prioritizes technical stability (Phase 1) before business logic (Phase 2) and high-cost/high-complexity scaling (Phase 3). By building the PostGIS/MapLibre foundation first, the system is guaranteed to handle the data volume added in Phase 3. Separating compliance (Phase 2) ensures the tool provides immediate legal value before scaling the scraping operation.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1: Stealth Browser Reliability** — Needs verification of Camoufox success rates on UK portals within a containerized environment.
- **Phase 2: Planning Data Coverage** — Research into DLUHC API coverage for all target councils to determine where manual PDF parsing might be needed.
- **Phase 3: Stannp/Postage Integration** — Reviewing API limitations for automated direct mail outreach.

Phases with standard patterns (skip research-phase):
- **Phase 1: Basic Map Interface** — Well-documented patterns in MapLibre and PostGIS.
- **Phase 2: ROI Calculations** — Formulas are standard in the R2R industry.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Modern, industry-standard choices for 2025; well-aligned with performance needs. |
| Features | HIGH | Table stakes and differentiators clearly identified for the UK R2R market. |
| Architecture | HIGH | Proven worker-based patterns for large-scale geospatial/scraping apps. |
| Pitfalls | HIGH | Clear alignment with recent UK regulatory changes (FHL abolition, Article 4). |

**Overall confidence: HIGH**

### Gaps to Address

- **Regional Council Data Fragmentation:** Article 4 data is notoriously inconsistent. Implementation must include a strategy for handling "dirty" data from different councils.
- **Ongoing Scraper Maintenance:** UK portals evolve anti-bot measures weekly. The roadmap must include a recurring buffer for scraper maintenance and proxy management.

## Sources

### Primary (HIGH confidence)
- [HMRC VAT Notice 709/5 (TOMS)](https://www.gov.uk/guidance/tour-operators-margin-scheme-for-vat-notice-7095) — Official source for SA VAT logic.
- [DLUHC Planning Data Platform](https://planning.data.gov.uk/) — Official source for Article 4 boundaries.
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/api/) — Technical foundation for visualization.
- [Camoufox Documentation](https://camoufox.com/docs/) — Technical source for stealth scraping patterns.

### Secondary (MEDIUM confidence)
- [AirDNA / AirROI APIs] — Standard for SA demand and occupancy data.
- [Nimbus Maps / Property Filter] — Benchmarked for Article 4 and DTV features.

---
*Research completed: 2025-02-28*
*Ready for roadmap: yes*
