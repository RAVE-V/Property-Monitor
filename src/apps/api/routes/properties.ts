import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../libs/database/db';
import { properties, scrapingJobs } from '../../libs/database/schema';
import { Queue } from 'bullmq';
import { sql, and, gte, lte, eq } from 'drizzle-orm';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const scraperQueue = new Queue('scrapers', { connection: { url: REDIS_URL } });

export async function propertyRoutes(fastify: FastifyInstance) {
  
  fastify.get('/properties', async (request, reply) => {
    const querySchema = z.object({
      bbox: z.string().optional(),
      minPrice: z.string().optional().transform(Number),
      maxPrice: z.string().optional().transform(Number),
      minBedrooms: z.string().optional().transform(Number),
      propertyType: z.string().optional(),
    });

    const params = querySchema.parse(request.query);
    const { bbox, minPrice, maxPrice, minBedrooms, propertyType } = params;
    
    const conditions = [];
    
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      conditions.push(sql`location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`);
    }

    if (minPrice) conditions.push(gte(properties.price, minPrice));
    if (maxPrice) conditions.push(lte(properties.price, maxPrice));
    if (minBedrooms) conditions.push(gte(properties.bedrooms, minBedrooms));
    if (propertyType) conditions.push(eq(properties.propertyType, propertyType));

    const results = await db.select().from(properties).where(and(...conditions));
    
    return {
      type: 'FeatureCollection',
      features: results.map((p: any) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.location.x, p.location.y],
        },
        properties: {
          id: p.id,
          title: p.title,
          price: p.price,
          bedrooms: p.bedrooms,
          propertyType: p.propertyType,
          url: p.url,
          planningIndicators: p.rawData?.planningIndicators || [],
        },
      })),
    };
  });

  fastify.post('/properties/scrape', async (request, reply) => {
    const bodySchema = z.object({
      url: z.string().url(),
    });

    const { url } = bodySchema.parse(request.body);

    await db.insert(scrapingJobs).values({
      propertyUrl: url,
      status: 'pending',
    });

    await scraperQueue.add('scrape', { url });

    return { success: true, message: "Scraping job queued" };
  });
}
