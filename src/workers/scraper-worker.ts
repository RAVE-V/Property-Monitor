import { Worker, Job } from 'bullmq';
import { scrapeOpenRent } from '../libs/scrapers/openrent';
import { db } from '../libs/database/db';
import { properties, scrapingJobs } from '../libs/database/schema';
import { eq } from 'drizzle-orm';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const scraperWorker = new Worker(
  'scrapers',
  async (job: Job) => {
    const { url } = job.data;
    console.log(`Processing scraping job for: ${url}`);
    
    // Update job status in DB
    await db.update(scrapingJobs)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(scrapingJobs.propertyUrl, url));

    try {
      const propertyData = await scrapeOpenRent(url);
      
      if (propertyData) {
        // Upsert property
        await db.insert(properties)
          .values({
            portalId: propertyData.portalId,
            url: propertyData.url,
            title: propertyData.title,
            price: propertyData.price,
            bedrooms: propertyData.bedrooms,
            propertyType: propertyData.propertyType,
            location: [propertyData.location.lng, propertyData.location.lat], // Drizzle handles spatial
            rawData: propertyData,
          })
          .onConflictDoUpdate({
            target: properties.portalId,
            set: {
              price: propertyData.price,
              scrapedAt: new Date(),
            }
          });

        await db.update(scrapingJobs)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(scrapingJobs.propertyUrl, url));
      } else {
        throw new Error("Failed to extract data");
      }
    } catch (error: any) {
      console.error(`Job failed: ${error.message}`);
      await db.update(scrapingJobs)
        .set({ status: 'failed', error: error.message, updatedAt: new Date() })
        .where(eq(scrapingJobs.propertyUrl, url));
      throw error;
    }
  },
  {
    connection: { url: REDIS_URL },
  }
);

scraperWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

scraperWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with ${err.message}`);
});
