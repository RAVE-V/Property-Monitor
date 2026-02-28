# Phase 2: Intelligence, Compliance & Hotspots - Research

**Researched:** 2026-02-28
**Domain:** UK Property Compliance, Hotspots, and Financial Math
**Confidence:** HIGH

## Summary

Phase 2 focuses on adding "intelligence" to the property map. The most critical technical components are the ingestion of Article 4 planning data from DLUHC, the implementation of a 2025-compliant ROI engine (including TOMS VAT logic), and the visualization of "hotspots" using Airbnb occupancy data.

The recommended approach uses **MapLibre GL JS v5** with its native heatmap and polygon layers. Data for Article 4 is fetched from the **DLUHC Planning Data Platform API**, which provides GeoJSON boundaries for UK local authorities. SA demand data is sourced from **Inside Airbnb** (free/open) or **AirDNA/AirROI** (commercial) to generate the heatmap. The ROI engine uses **Big.js** for precision and implements the **Post-April 2025 UK tax changes** (abolition of FHL) and **TOMS VAT logic** for R2R operators.

**Primary recommendation:** Use DLUHC's GeoJSON API for Article 4 boundaries and MapLibre's `heatmap` layer type for demand visualization.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Heatmap Style**: Smooth heatmap overlay (gradient) representing **Occupancy %** as the primary intensity metric.
- **Tax Strategy**: Default to **Post-April 2025** rules (abolition of FHL benefits).
- **VAT**: Optional **TOMS (Tour Operators Margin Scheme)** toggle for Rent-to-Rent SA operators.
- **Expenses**: Room-based default assumptions (e.g., £50/room for bills) with manual override.
- **Compliance Visualization**: Shaded polygons (transparent) for Article 4 zones to identify HMO-restricted areas.

### Claude's Discretion
- Exact hex colors and blur radius for the heatmap.
- Visual design of the 'Demand' submenu and opacity slider.
- Specific data sources for travel-time/isochrone calculations.

### Deferred Ideas (OUT OF SCOPE)
- "Tired Landlord" detection (long time-on-market signals) — Phase 3
- SpareRoom room-rate scraping — Phase 3
- Direct-to-Vendor (DTV) outreach — v2+
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-04 | Article 4 direction ingestion | DLUHC Planning Data API provides GeoJSON for Article 4. |
| CALC-02 | Advanced ROI with TOMS VAT | HMRC VAT 709/5 confirms 20% on margin calculation. |
| CALC-03 | Post-2025 UK Tax rules | FHL regime abolition handled via standard Income Tax rates. |
| HOT-01 | SA Demand Heatmaps | MapLibre `heatmap` layer using Airbnb/Booking.com occupancy. |
| HOT-02 | Infrastructure/Tourism Hubs | OSM Landmarks + OpenRouteService for isochrones. |
| PLAN-01 | Basic Planning Status | DLUHC API integration for individual property lookups. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| MapLibre GL JS | v5.19+ | Map Engine | High performance with Heatmaps/Polygons via WebGPU. |
| Drizzle ORM | v0.30+ | Spatial DB Ops | Type-safe PostGIS queries for Article 4 intersection. |
| Big.js | v6.x | Financial Math | Precision is critical for ROI and VAT logic. |
| OpenRouteService | API | Isochrones | Best-in-class open isochrone API (free tier available). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| simple-statistics | v7.x | Heatmap binning | If pre-calculating intensity on server. |
| d3-color | v3.x | Legend gradients | Generating smooth legends for the UI. |

## Architecture Patterns

### Pattern 1: Spatial Intersection for Article 4
**What:** Instead of checking boundaries on client, use PostGIS `ST_Intersects` to tag properties with their Article 4 status on ingestion.
**When to use:** On scraper/API ingestion to reduce client-side compute.
**Example:**
```sql
SELECT properties.*, zones.name as article_4_zone
FROM properties
LEFT JOIN article_4_zones zones ON ST_Intersects(properties.location, zones.geom)
```

### Pattern 2: TOMS VAT Logic
**What:** Calculation: `VAT = (Gross Income - Direct Costs) * (VAT_RATE / (1 + VAT_RATE))`.
**Note:** Direct costs include Rent to Landlord and Utilities, but NOT agent commissions or overhead.

## Common Pitfalls

### Pitfall 1: Heatmap Performance
**What goes wrong:** Rendering 10k+ points in a heatmap can stutter.
**How to avoid:** Use MapLibre's native `heatmap` layer type which runs on the GPU, and limit the dataset to the current viewport if necessary.

### Pitfall 2: Article 4 Data "Dirty"
**What goes wrong:** Council boundaries often overlap or use inconsistent naming.
**How to avoid:** Normalize council names to ONS codes where possible.

## Code Examples

### MapLibre Heatmap Layer
```typescript
map.addLayer({
  id: 'sa-demand-heatmap',
  type: 'heatmap',
  source: 'sa-demand',
  paint: {
    'heatmap-weight': ['get', 'occupancy'],
    'heatmap-intensity': 1,
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(0, 0, 255, 0)',
      0.5, 'yellow',
      1, 'red'
    ],
    'heatmap-radius': 30,
    'heatmap-opacity': 0.7
  }
});
```

## Sources

### Primary (HIGH confidence)
- [HMRC VAT Notice 709/5 (TOMS)](https://www.gov.uk/guidance/tour-operators-margin-scheme-for-vat-notice-7095)
- [DLUHC Planning Data Platform](https://planning.data.gov.uk/dataset/article-4-direction)
- [MapLibre GL JS Docs](https://maplibre.org/maplibre-gl-js-docs/example/heatmap-layer/)

---
*Research completed: 2026-02-28*
*Ready for planning: yes*
