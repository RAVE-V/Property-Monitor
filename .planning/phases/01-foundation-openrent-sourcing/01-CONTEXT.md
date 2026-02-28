# Phase 1: Foundation & OpenRent Sourcing - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Establishing the core UK property mapping infrastructure and initial data pipeline. This includes a high-performance interactive map displaying listings scraped from OpenRent, basic property filtering, and an initial profit/ROI calculator for rent-to-rent (R2R) investors.

</domain>

<decisions>
## Implementation Decisions

### Map Visualization & Markers
- **Technology**: MapLibre GL JS v5.x with WebGPU for 60fps performance.
- **Clustering**: High-density areas will cluster markers; clicking a cluster zooms into that region.
- **Markers**: Single markers show price or property type (icon) at a glance; clicking opens the analysis side panel.

### Analysis Panel UI/UX
- **Layout**: Side panel (left or right) to maintain map visibility.
- **Hierarchy**: Main photo > ROI Summary (High-level) > Profit Breakdown (Expandable) > Property Metadata.
- **States**: Loading skeletons for property details while scraping/fetching data.

### Search & Filter Flow
- **Sync**: The list view and map stay in sync; panning the map updates the list in real-time ("Auto-refresh as you pan").
- **Filters**: Price, Bedrooms, Property Type (House/Flat) as immediate-apply filters.

### Calculator Logic Defaults
- **Input**: User can override any field (Rent, Bills, Fees), but defaults are provided based on R2R averages (e.g., 10-15% management fee).
- **Strategy**: Focused on Rent-to-Rent (R2R) Serviced Accommodation (SA) for Phase 1.

### Claude's Discretion
- Exact styling and typography of the UI.
- Specific clustering radius and zoom thresholds.
- Data ingestion retry logic and proxy rotation strategy for Camoufox.

</decisions>

<specifics>
## Specific Ideas

- "Modern, interactive feel similar to worldmonitor.app."
- Map should feel 'alive'—markers should update instantly as filters change.
- Side panel should clearly differentiate between 'Income' and 'Expenses' for the profit analysis.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None (Greenfield project).

### Established Patterns
- Research recommended: Fastify v5 for the backend, PostgreSQL/PostGIS for the spatial database, and MapLibre v5 for the frontend.

### Integration Points
- This phase establishes the initial integration between the web frontend (MapLibre), the scraping backend (Camoufox/BullMQ), and the database (PostGIS).

</code_context>

<deferred>
## Deferred Ideas

- Article 4 Planning Boundaries — Phase 2
- SpareRoom/Zoopla Integration — Phase 3
- "Tired Landlord" detection — Phase 3 (v2+)

</deferred>

---

*Phase: 01-foundation-openrent-sourcing*
*Context gathered: 2026-02-28*
