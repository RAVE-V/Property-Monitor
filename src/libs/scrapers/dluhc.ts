import { db } from '../database/db';
import { article4Zones } from '../database/schema';
import { sql } from 'drizzle-orm';

/**
 * Fetches Article 4 GeoJSON from DLUHC and upserts into PostGIS.
 */
export async function scrapeArticle4Boundaries(councilSlug: string) {
  try {
    const url = `https://planning.data.gov.uk/dataset/article-4-direction.json`;
    const response = await fetch(url);
    const data: any = await response.json();

    console.log(`Fetched ${data.features.length} boundaries from DLUHC`);

    for (const feature of data.features) {
      const name = feature.properties.name || 'Unnamed Zone';
      const councilId = feature.properties.organisation || councilSlug;
      const zoneType = 'HMO'; // Default for v1

      await db.insert(article4Zones).values({
        name,
        councilId,
        zoneType,
        // Drizzle spatial helper for GeoJSON to geometry
        boundary: sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(feature.geometry)}), 4326)`,
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to scrape DLUHC boundaries:', error);
    return false;
  }
}
