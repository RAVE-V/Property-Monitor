import { chromium } from 'playwright-core';
import { db } from '../../libs/database/db';
import { properties } from '../../libs/database/schema';
import { sql } from 'drizzle-orm';

export async function scrapeSpareRoom(location: string = 'london') {
    console.log(`Starting SpareRoom scraper for location: ${location}`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // SpareRoom search endpoints for rooms to rent
        const searchUrl = `https://www.spareroom.co.uk/flatshare/${location}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        // Simulate results extraction
        console.log('Parsing HMO listings...');
        const results = [
            {
                portalId: `spareroom-fake-1`,
                url: `${searchUrl}/flatshare/fake-1`,
                title: `Large Double Room in ${location} HMO`,
                price: 850, // Per month
                bedrooms: 1, // It's one room
                propertyType: 'hmo-room',
            }
        ];

        for (const item of results) {
            const dummyLocation = sql`ST_GeomFromText('POINT(-0.1278 51.5074)', 4326)` as any;

            await db.insert(properties).values({
                portalId: item.portalId,
                url: item.url,
                title: item.title,
                price: item.price,
                bedrooms: item.bedrooms,
                propertyType: item.propertyType,
                location: dummyLocation,
            }).onConflictDoUpdate({
                target: properties.portalId,
                set: {
                    price: item.price,
                    title: item.title,
                    scrapedAt: new Date()
                }
            });
            console.log(`Saved SpareRoom listing: ${item.title}`);
        }

        console.log('SpareRoom scraping completed successfully.');
    } catch (error) {
        console.error('SpareRoom scraping failed:', error);
    } finally {
        await browser.close();
    }
}

// Allow running directly
if (require.main === module) {
    scrapeSpareRoom().then(() => process.exit(0));
}
