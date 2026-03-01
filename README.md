# Property Monitor (formerly Property Intel)

Property Monitor is a highly optimized, automated real estate investment and analysis platform designed for Serviced Accommodation (SA), Rent-to-Rent (R2R), and HMO strategies. It seamlessly aggregates live market data, maps local demand signals, and features an integrated AI-driven valuation engine to help investors rapidly identify, underwrite, and intercept lucrative property opportunities across the UK.

![Dashboard Preview](./docs/screenshot.png) *(Add a screenshot here later)*

## Core Features

- **Automated Market Scraping Pipeline:** Ingests live real estate listings concurrently from major UK portals (Rightmove, Zoopla, OpenRent) directly into an optimized PostGIS SQL database.
- **Dynamic Heatmaps & Spatial Analysis:** An interactive Mapbox implementation layered over Carto maps visualizes Airbnb/VRBO local demand epicenters, Article 4 planning zones, and high-occupancy hotspots directly around prospective properties.
- **Open Telemetry Table:** Instantly browse and filter all available opportunities. The customized UI natively evaluates raw property prices against standard SA profitability heuristics to present immediate `Rent PCM` and projected `Yield` values out-of-the-box.
- **AI Expert Verdict Engine:** A multi-layered algorithmic assessor processes physical dimensions, recent price drops, local occupancy metrics, and known landlord traits to deliver an automated investment summary (e.g. "Strong SA Potential", "Proceed with Caution").
- **SA/R2R Profit Model Calculator:** A built-in financial underwriting tool embedded right into the property Side Panel. It dynamically reverse-engineers estimated Revenue and TOMS VAT liabilities to calculate live ROI and Break-Even ADR metrics.
- **Satellite Dashboard (Kanban CRM):** A drag-and-drop lead management pipeline. It natively integrates with staging scripts to intercept leads and automatically funnels sold properties into a designated tracker.
- **Direct Mail Integration:** One-click integration with the Stannp API allows automated physical letter distribution directly to highly motivated property vendors or "tired landlords".

## Tech Stack

*   **Framework:** Next.js (React)
*   **Styling:** Tailwind CSS
*   **Database:** PostgreSQL with PostGIS (Spatial queries)
*   **ORM:** Drizzle ORM
*   **Mapping:** Mapbox GL JS / MapLibre 
*   **Data Ingestion:** Playwright Core (Concurrent scraping workers)
*   **UI Components:** Custom Glassmorphism UI tailored for data fidelity

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   Docker (for local Postgres / PostGIS setup)
*   Mapbox API Key
*   Stannp API Key (optional, for physical mailouts)

### Local Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/RAVE-V/Property-Monitor.git
   cd Property-Monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Rename `.env.example` to `.env` and fill in your connection strings and API keys.
   ```bash
   DATABASE_URL="postgres://user:password@localhost:5432/propertyintel"
   NEXT_PUBLIC_MAPBOX_TOKEN="your_token_here"
   STANNP_API_KEY="your_token_here"
   ```

4. **Initialize Database**
   Ensure your database is running, then run the Drizzle migrations to build the schema:
   ```bash
   npm run db:push
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` to interact with the application.

## Deployment

### 1. Database (Neon)
- Create a serverless Postgres instance at [Neon.tech](https://neon.tech/).
- Copy your connection string and add it to your `.env` or Vercel Environment Variables as `DATABASE_URL`.

### 2. Redis (Upstash)
- Create a free Redis database at [Upstash](https://upstash.com/).
- Use the provided Redis URL for `REDIS_URL`.

### 3. Automated Scraping (GitHub Actions)
The project includes a GitHub Action in `.github/workflows/scrape.yml` that runs the scraper every 6 hours.
To enable it:
1. Go to your GitHub repository **Settings** > **Secrets and variables** > **Actions**.
2. Add the following **Secrets**:
    - `DATABASE_URL`: Your Neon connection string.
    - `REDIS_URL`: Your Upstash Redis URL.
3. The scraper will now run automatically. You can also trigger it manually from the **Actions** tab.

## Legal & Compliance

This software integrates data scraping functionality. Please ensure all data scraping operations strictly comply with the Terms of Service of the targeted portals and all local data privacy regulations (e.g. GDPR). This platform is intended as an analytical aggregator—always conduct your own legal due diligence on Article 4 boundary mappings before executing contracts.

## License

All Rights Reserved.
