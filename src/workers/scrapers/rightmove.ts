import { chromium } from 'playwright-core';
import { db } from '../../libs/database/db';
import { properties } from '../../libs/database/schema';
import { sql } from 'drizzle-orm';

// Mocking "Tired Landlord" detection
export async function scrapeRightmove(location: string = 'manchester') {
    console.log(`[Rightmove] Starting proxy-rotated scraper for: ${location}`);

    // In production, Camoufox + BrightData proxy rotation goes here to bypass Rightmove 403s.
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        const searchUrl = `https://www.rightmove.co.uk/property-to-rent/find.html?searchLocation=${location}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        console.log('[Rightmove] Parsing property lists for Tired Landlords...');

        // Simulating data extraction where a property has been on the market for a long time 
        // and has experienced price reductions.
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        const results = [
            {
                portalId: `rightmove-fake-1`,
                url: `https://www.rightmove.co.uk/properties/fake-1`,
                title: `2 Bed Apartment For Rent in ${location}`,
                price: 1100, // Reduced price
                originalPrice: 1300,
                bedrooms: 2,
                propertyType: 'apartment',
                timeOnMarket: 60, // Old listing (60 days)
                firstSeenAt: twoMonthsAgo,
                isTiredLandlord: true,
                imageUrl: 'https://media.rightmove.co.uk/dir/crop/10:9-16:9/96k/95522/153139364/95522_125028040108_IMG_00_0000_max_476x317.jpeg'
            },
            {
                portalId: `rightmove-fake-2`,
                url: `https://www.rightmove.co.uk/properties/fake-2`,
                title: `3 Bed House For Rent in ${location}`,
                price: 1600,
                originalPrice: 1600,
                bedrooms: 3,
                propertyType: 'house',
                timeOnMarket: 2, // New listing (2 days)
                firstSeenAt: new Date(),
                isTiredLandlord: false,
                status: 'sold',
                imageUrl: 'https://media.rightmove.co.uk/dir/crop/10:9-16:9/11k/10187/154564553/10187_2961521_IMG_00_0000_max_476x317.jpeg'
            }
        ];

        for (const item of results) {
            // Point coordinates (longitude, latitude) near Manchester
            const dummyLocation = sql`ST_GeomFromText('POINT(-2.24 53.48)', 4326)` as any;

            await db.insert(properties).values({
                portalId: item.portalId,
                source: 'rightmove',
                url: item.url,
                title: item.title,
                price: item.price,
                bedrooms: item.bedrooms,
                propertyType: item.propertyType,
                location: dummyLocation,
                originalPrice: item.originalPrice,
                timeOnMarket: item.timeOnMarket,
                firstSeenAt: item.firstSeenAt,
                isTiredLandlord: item.isTiredLandlord,
                status: item.status || 'active',
                rawData: { imageUrl: item.imageUrl }
            }).onConflictDoUpdate({
                target: properties.portalId,
                set: {
                    price: item.price,
                    title: item.title,
                    isTiredLandlord: item.isTiredLandlord,
                    timeOnMarket: item.timeOnMarket,
                    status: item.status || 'active',
                    firstSeenAt: item.firstSeenAt,
                    originalPrice: item.originalPrice,
                    scrapedAt: new Date()
                }
            });
            console.log(`[Rightmove] Saved: ${item.title} (Tired Landlord: ${item.isTiredLandlord})`);
        }

        console.log('[Rightmove] Scraping completed successfully.');
    } catch (error) {
        console.error('[Rightmove] Scraping failed:', error);
    } finally {
        await browser.close();
    }
}


