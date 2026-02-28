# Phase 2: Intelligence, Compliance & Hotspots - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Enhancing Property Intel with advanced geospatial intelligence (hotspots and compliance) and specialized financial modeling. This includes layering Airbnb/Booking occupancy data, visualizing Article 4 planning boundaries, and implementing a 2025 UK tax-compliant ROI engine.

</domain>

<decisions>
## Implementation Decisions

### Hotspot Visualization (SA Demand)
- **Style**: Smooth heatmap overlay (gradient) representing **Occupancy %** as the primary intensity metric.
- **Interactions**: Manual opacity slider in the legend/controls to adjust visibility.
- **Legend**: Detailed legend explaining color scales and estimated monthly occupancy rates.

### Advanced Profit Logic (UK 2025)
- **Tax Strategy**: Default to **Post-April 2025** rules (abolition of FHL benefits).
- **VAT**: Optional **TOMS (Tour Operators Margin Scheme)** toggle for Rent-to-Rent SA operators.
- **Expenses**: Room-based default assumptions (e.g., £50/room for bills) with manual override.
- **Break-even**: Specific metric for **Minimum room rate (ADR) based on 60% occupancy**.

### Demand Cohort Layers
- **Target**: Focus on **Tourism & Infrastructure Hubs** (landmarks, large-scale construction sites like HS2).
- **Visuals**: Subtle **glowing pulses** on the map to indicate high-demand epicenters.
- **Filtering**: **Travel Time Radius** (isochrones) showing properties within 5/10/15 minutes of a hub.
- **Controls**: Toggles for specific cohort categories in a 'Demand' submenu.

### Compliance Visualization
- **Style**: Shaded polygons (transparent) for Article 4 zones to identify HMO-restricted areas.
- **Logic**: Properties inside restricted zones should show a clear "Article 4" warning badge in the side panel.

### Claude's Discretion
- Exact hex colors and blur radius for the heatmap.
- Visual design of the 'Demand' submenu and opacity slider.
- Specific data sources for travel-time/isochrone calculations.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Map.tsx`: Existing MapLibre v5 integration; needs new layers for heatmaps and polygons.
- `SidePanel.tsx`: Basic ROI calculator UI; needs new toggles for TOMS and break-even logic.
- `schema.ts`: PostGIS `properties` table; need to add a `polygons` or `zones` table for Article 4.

### Established Patterns
- **GeoJSON FeatureCollections**: Used for property markers; can be extended for hotspot grids/zones.
- **Zod Schema Validation**: Used in API routes; will be used for complex ROI input validation.

### Integration Points
- **Map Layers**: Adding new `heatmap` and `fill` layers to the existing MapLibre source/layer stack.
- **Profit Engine**: Extending the `calculateROI` utility with the new 2025 tax logic.

</code_context>

<specifics>
## Specific Ideas

- "I want the hotspots to clearly show where the best occupancy is, not just where the most listings are."
- The travel-time radius should feel interactive—move the 'hub' and see properties update.
- ROI results should be extremely clear about the impact of TOMS on net profit.

</specifics>

<deferred>
## Deferred Ideas

- "Tired Landlord" detection (long time-on-market signals) — Phase 3
- SpareRoom room-rate scraping — Phase 3
- Direct-to-Vendor (DTV) outreach — v2+

</deferred>

---

*Phase: 02-intelligence-compliance-hotspots*
*Context gathered: 2026-02-28*
