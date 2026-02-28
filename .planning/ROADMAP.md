# Roadmap: Property Intel

This roadmap outlines the path to building a high-performance UK property intelligence tool for rent-to-rent investors.

## Phases

- [ ] **Phase 1: Foundation & OpenRent Sourcing** - Establish map-based visualization and basic profit analysis using OpenRent data.
- [ ] **Phase 2: Intelligence, Compliance & Hotspots** - Layer in SA demand data, Article 4 planning boundaries, and tax-compliant financial modeling.
- [ ] **Phase 3: Portal Scaling & Lead Management** - Expand data ingestion to SpareRoom and Zoopla, and implement lead tracking tools.

## Progress Tracking

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & OpenRent Sourcing | 5/5 | Complete | 2026-02-28 |
| 2. Intelligence, Compliance & Hotspots | 4/4 | Complete | 2026-02-28 |
| 3. Portal Scaling & Lead Management | 0/0 | Not started | - |

## Phase Details

### Phase 1: Foundation & OpenRent Sourcing
**Goal**: Users can identify and analyze property listings from OpenRent on a high-performance interactive map.
**Depends on**: Nothing
**Requirements**: MAP-01, MAP-02, MAP-03, MAP-04, DATA-01, CALC-01, USER-01, PLAN-02
**Success Criteria**:
  1. User can pan and zoom the map with 1,000+ property markers maintaining 60fps performance.
  2. User can view live property listings scraped from OpenRent via stealth browsers.
  3. User can filter the map by price, bedrooms, and property type with instant marker updates.
  4. User can click a property marker to see a side panel with automated profit/loss calculations.
  5. User can see basic planning status indicators for any listed property.
**Plans**:
  - [x] 01-01: Infrastructure & Data Foundation
  - [x] 01-02: OpenRent Scraper & API
  - [x] 01-03: Interactive Map Visualization
  - [x] 01-04: Analysis Side-Panel & Profit Calculator
  - [x] 01-05: Map Filters & Planning Indicators

### Phase 2: Intelligence, Compliance & Hotspots
**Goal**: Users can identify high-profit "hotspots" and verify regulatory compliance for SA and HMO strategies.
**Depends on**: Phase 1
**Requirements**: DATA-04, CALC-02, CALC-03, HOT-01, HOT-02, PLAN-01
**Success Criteria**:
  1. User can toggle a heatmap layer showing Airbnb/Booking.com booking density (Hotspots).
  2. User can see Article 4 planning restriction boundaries overlaid on the map.
  3. User can view ROI projections that automatically account for TOMS VAT logic and R2R-specific expenses.
  4. User can visualize demand layers for specific cohorts like hospital workers or tourists.
**Plans**:
  - [x] 02-01: Intelligence Schemas & Advanced ROI
  - [x] 02-02: Compliance Ingestion & Hotspot Data
  - [x] 02-03: Hotspot & Compliance Visualizations
  - [x] 02-04: Demand Hubs & Isochrones

### Phase 3: Portal Scaling & Lead Management
**Goal**: Users can source deals from multiple UK portals and manage a personal pipeline of investment leads.
**Depends on**: Phase 2
**Requirements**: DATA-02, DATA-03, USER-02
**Success Criteria**:
  1. User can see aggregated property listings from Zoopla, OnTheMarket, and SpareRoom on the same map.
  2. User can "Save for Review" promising properties and access them in a dedicated list.
  3. User can switch between a map-first view and a synchronized list view of available deals.
**Plans**: TBD
