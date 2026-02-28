# Requirements: Property Intel

**Defined:** 2026-02-28
**Core Value:** Empower rent-to-rent investors to quickly identify high-profit property investment opportunities in the UK market through data-driven hotspot analysis and automated profit calculations.

## v1 Requirements

### Map & Visualization

- [ ] **MAP-01**: High-performance interactive map (MapLibre v5 + WebGPU) showing property locations.
- [ ] **MAP-02**: Map clustering for high-density property areas to ensure performance.
- [ ] **MAP-03**: Responsive map filters (Location, Price, Bedroom count, Property Type).
- [ ] **MAP-04**: Interactive property markers that open detailed analysis side-panels.

### Data Ingestion

- [ ] **DATA-01**: Robust property scraper for OpenRent using Camoufox (Stealth) to avoid bot detection.
- [ ] **DATA-02**: Property scraper for SpareRoom to gather HMO room rate data.
- [ ] **DATA-03**: Integration with Zoopla/OnTheMarket data for market listings.
- [ ] **DATA-04**: Integration with AirDNA or AirROI for SA demand and RevPAR data.

### Profit Engine

- [ ] **CALC-01**: Automated profit calculator for individual properties (Rent, Bills, Management Fees).
- [ ] **CALC-02**: UK Tax-compliant calculation logic (TOMS - Tour Operators Margin Scheme for R2R-SA).
- [ ] **CALC-03**: ROI and Net Profit projection display with "What-if" scenario adjustments.

### Hotspot & Demand Analysis

- [ ] **HOT-01**: Hotspot heatmap layer based on Airbnb and Booking.com booking density.
- [ ] **HOT-02**: Proximity-based demand layers for Workers (hospitals, infrastructure) and Tourists.

### Planning & Compliance

- [ ] **PLAN-01**: Article 4 Planning boundary overlays on the map to identify HMO-restricted zones.
- [ ] **PLAN-02**: Basic planning status indicators for listed properties.

### User Tools

- [ ] **USER-01**: Property search and list view synchronized with the map viewport.
- [ ] **USER-02**: "Save for Review" feature to track promising investment leads.

## v2 Requirements

### Advanced Automation

- **AUTO-01**: "Tired Landlord" detection (long time-on-market, price drops).
- **AUTO-02**: Direct-to-Vendor (DTV) outreach automation (Stannp/Postage integration).

### Scaling

- **DATA-05**: Full scraper suite for hostile portals (Rightmove/Zoopla) with advanced proxy rotation.
- **PLAN-03**: Detailed C5 Use Class (Short-term Lets) planning layers.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Direct Booking Management | Focused on investment analysis, not day-to-day property management. |
| Legal/Contract Generation | High liability, requires professional legal consultation. |
| Global Markets | Initial focus is strictly the UK regulatory and property landscape. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MAP-01 | Phase 1 | Pending |
| MAP-02 | Phase 1 | Pending |
| MAP-03 | Phase 1 | Pending |
| MAP-04 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 2 | Pending |
| DATA-03 | Phase 2 | Pending |
| DATA-04 | Phase 2 | Pending |
| CALC-01 | Phase 1 | Pending |
| CALC-02 | Phase 2 | Pending |
| CALC-03 | Phase 2 | Pending |
| HOT-01 | Phase 2 | Pending |
| HOT-02 | Phase 2 | Pending |
| PLAN-01 | Phase 1 | Pending |
| PLAN-02 | Phase 1 | Pending |
| USER-01 | Phase 1 | Pending |
| USER-02 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-02-28 after initial definition*
