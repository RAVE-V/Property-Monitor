import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import { sql, eq } from 'drizzle-orm';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

/**
 * Checks if a property is within any Article 4 zones and updates its status.
 */
export async function checkPropertyCompliance(propertyId: string) {
  const property = await db.query.properties.findFirst({
    where: eq(schema.properties.id, propertyId),
  });

  if (!property) return null;

  // Find intersecting zones
  const intersectingZones = await db.select({
    id: schema.article4Zones.id,
  }).from(schema.article4Zones)
    .where(sql`ST_Intersects(${schema.properties.location}, ${schema.article4Zones.boundary})`);

  const isArticle4 = intersectingZones.length > 0;
  const zoneId = isArticle4 ? intersectingZones[0]!.id : null;

  // Update property
  await db.update(schema.properties)
    .set({
      isArticle4,
      article4ZoneId: zoneId,
    })
    .where(eq(schema.properties.id, propertyId));

  return { isArticle4, zoneId };
}
