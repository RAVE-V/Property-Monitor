import { db } from '../database/db';
import { article4Zones } from '../database/schema';
import { sql } from 'drizzle-orm';

export async function ingestC5Zones() {
  console.log('Ingesting C5 Short-term Let restriction zones...');

  const zones = [
    {
      name: 'Westminster STL Restriction Zone',
      councilId: 'westminster',
      zoneType: 'C5',
      // Approx Westminster boundary
      boundary: sql`ST_GeomFromText('POLYGON((-0.165 51.520, -0.115 51.520, -0.115 51.485, -0.165 51.485, -0.165 51.520))', 4326)`
    },
    {
      name: 'Edinburgh STL Control Area',
      councilId: 'edinburgh',
      zoneType: 'C5',
      // Approx Edinburgh city center
      boundary: sql`ST_GeomFromText('POLYGON((-3.220 55.960, -3.170 55.960, -3.170 55.940, -3.220 55.940, -3.220 55.960))', 4326)`
    }
  ];

  try {
    for (const zone of zones) {
      await db.insert(article4Zones).values(zone).onConflictDoNothing();
    }
    console.log('C5 zone ingestion complete.');
  } catch (error) {
    console.error('Failed to ingest C5 zones:', error);
  }
}
