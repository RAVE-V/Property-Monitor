import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../libs/database/db';
import { demandPoints, article4Zones } from '../../../libs/database/schema';
import { sql, and } from 'drizzle-orm';

export async function hotspotRoutes(fastify: FastifyInstance) {

  fastify.get('/hotspots', async (request, reply) => {
    const querySchema = z.object({
      bbox: z.string().optional(),
    });

    const { bbox } = querySchema.parse(request.query);
    let whereClause = sql`TRUE`;

    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      whereClause = sql`location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`;
    }

    const results = await db.select().from(demandPoints).where(whereClause);

    return {
      type: 'FeatureCollection',
      features: results.map((p: any) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.location.x, p.location.y],
        },
        properties: {
          occupancy: p.occupancy,
          source: p.source,
        },
      })),
    };
  });

  fastify.get('/zones', async (request, reply) => {
    const querySchema = z.object({
      bbox: z.string().optional(),
    });

    const { bbox } = querySchema.parse(request.query);
    let whereClause = sql`TRUE`;

    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      whereClause = sql`boundary && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`;
    }

    const results = await db.select().from(article4Zones).where(whereClause);

    return {
      type: 'FeatureCollection',
      features: results.map((z: any) => ({
        type: 'Feature',
        geometry: z.boundary, // PostGIS geometry to GeoJSON
        properties: {
          id: z.id,
          name: z.name,
          zoneType: z.zoneType,
        },
      })),
    };
  });
}
