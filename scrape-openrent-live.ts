/**
 * scrape-openrent-live.ts
 * Scrapes OpenRent search pages for multiple UK cities.
 * Uses correct Bootstrap selectors discovered via DOM inspection.
 * Run: npx tsx scrape-openrent-live.ts
 */
import { chromium } from 'playwright-core';
import { db } from './src/libs/database/db.js';
import { properties } from './src/libs/database/schema.js';
import { sql } from 'drizzle-orm';

const SEARCH_TARGETS = [
    { city: 'london', label: 'London', defaultLng: -0.1276, defaultLat: 51.5074 },
    { city: 'manchester', label: 'Manchester', defaultLng: -2.2426, defaultLat: 53.4808 },
    { city: 'birmingham', label: 'Birmingham', defaultLng: -1.8904, defaultLat: 52.4862 },
    { city: 'leeds', label: 'Leeds', defaultLng: -1.5491, defaultLat: 53.8008 },
    { city: 'bristol', label: 'Bristol', defaultLng: -2.5879, defaultLat: 51.4545 },
];

interface Listing {
    portalId: string;
    url: string;
    title: string;
    price: number;
    bedrooms: number;
    propertyType: string;
    postcode: string | null;
    lat: number;
    lng: number;
}

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const clean = postcode.replace(/\s+/g, '').toUpperCase();
        const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`);
        if (!res.ok) {
            // Try outward code lookup for partial postcodes (e.g. SW6, M1)
            const outcodeRes = await fetch(`https://api.postcodes.io/outcodes/${clean}`);
            if (!outcodeRes.ok) return null;
            const json = await outcodeRes.json() as any;
            if (json.status === 200 && json.result) {
                return { lat: json.result.latitude, lng: json.result.longitude };
            }
            return null;
        }
        const json = await res.json() as any;
        if (json.status === 200 && json.result) {
            return { lat: json.result.latitude, lng: json.result.longitude };
        }
        return null;
    } catch { return null; }
}

async function scrapeOpenRentCity(city: string, defaultLng: number, defaultLat: number): Promise<Listing[]> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    const listings: Listing[] = [];

    try {
        const searchUrl = `https://www.openrent.co.uk/properties-to-rent/?term=${encodeURIComponent(city)}&min_beds=1&max_beds=8&min_price=500&max_price=5000`;
        console.log(`  → ${searchUrl}`);

        await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForSelector('a.pli', { timeout: 10000 });

        const raw = await page.evaluate(() => {
            const cards = document.querySelectorAll<HTMLAnchorElement>('a.pli');
            const results: Array<{
                id: string;
                href: string;
                priceText: string;
                innerText: string;
            }> = [];

            cards.forEach(card => {
                const href = card.getAttribute('href') || '';
                // IDs can be e.g. /2634487 or /property-to-rent/london/.../2634487
                const idMatch = href.match(/\/(\d+)(?:\/|$)/);
                const id = idMatch ? idMatch[1]! : '';
                if (!id) return;

                // Price: look for span with £ in its text
                let priceText = '';
                const spans = card.querySelectorAll('span');
                for (const s of spans) {
                    const t = s.textContent?.trim() || '';
                    if (t.startsWith('£') && t.length < 20) { priceText = t; break; }
                }

                results.push({ id, href, priceText, innerText: (card as HTMLElement).innerText });
            });

            return results;
        });

        console.log(`  Found ${raw.length} cards for ${city}`);

        for (const item of raw.slice(0, 40)) {
            const price = parseInt(item.priceText.replace(/[^0-9]/g, '')) || 0;
            if (price === 0) continue;

            // Parse innerText — format is roughly:
            // "£2,300\nper month\n0.02\nkm\nLast updated ...\nTitle Text\nDescription...\nX Beds\nY Baths\n..."
            const lines = item.innerText.split('\n').map(l => l.trim()).filter(Boolean);

            // Title: look for a line matching "N Bed X, Location, PostcodeArea" or "Room in a Shared ..."
            let title = '';
            let postcode = '';
            for (const line of lines) {
                if (/^\d+\s*(Bed|Room|Studio)/i.test(line) || /^Room in/i.test(line) || /^Studio/i.test(line)) {
                    title = line;
                    // Extract postcode from title e.g. "SW6" or "SW1A"
                    const pcMatch = line.match(/,\s*([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d?[A-Z]{0,2})\s*$/i);
                    if (pcMatch) postcode = pcMatch[1]!.trim().toUpperCase();
                    break;
                }
            }
            if (!title) continue; // skip cards without a parseable title

            // Extract beds from title or features lines
            const bedMatch = title.match(/(\d+)\s*Bed/i);
            const roomMatch = title.match(/(\d+)?\s*Room/i);
            const beds = bedMatch ? parseInt(bedMatch[1]!) : (roomMatch && roomMatch[1] ? parseInt(roomMatch[1]!) : (title.toLowerCase().includes('studio') ? 0 : 1));

            // Property type from title
            const typeMatch = title.match(/\d+\s*Bed\s+(\w+)/i) || title.match(/^(Studio|Room|Flat|House|Apartment)/i);
            const propertyType = typeMatch ? typeMatch[1]! : 'Property';

            // Geocode postcode (partial or full)
            let lat = defaultLat;
            let lng = defaultLng;
            if (postcode) {
                const geo = await geocodePostcode(postcode);
                if (geo) { lat = geo.lat; lng = geo.lng; }
            }

            const fullUrl = `https://www.openrent.co.uk${item.href}`;

            listings.push({
                portalId: `openrent-${item.id}`,
                url: fullUrl,
                title,
                price,
                bedrooms: beds,
                propertyType,
                postcode: postcode || null,
                lat,
                lng,
            });
        }
    } catch (err) {
        console.error(`  ✗ Error scraping ${city}:`, err);
    } finally {
        await browser.close();
    }

    return listings;
}

async function run() {
    console.log('\n🏠 OpenRent Live Scraper – Starting\n');
    let totalUpserted = 0;

    for (const target of SEARCH_TARGETS) {
        console.log(`\n📍 ${target.label}`);
        const listings = await scrapeOpenRentCity(target.city, target.defaultLng, target.defaultLat);
        console.log(`  Parsed ${listings.length} valid listings`);

        for (const listing of listings) {
            try {
                const locSql = sql`ST_SetSRID(ST_MakePoint(${listing.lng}, ${listing.lat}), 4326)` as any;

                await db.insert(properties).values({
                    portalId: listing.portalId,
                    source: 'openrent',
                    url: listing.url,
                    title: listing.title,
                    price: listing.price,
                    bedrooms: listing.bedrooms,
                    propertyType: listing.propertyType,
                    location: locSql,
                    originalPrice: listing.price,
                    scrapedAt: new Date(),
                    firstSeenAt: new Date(),
                    timeOnMarket: 0,
                    isTiredLandlord: false,
                    isArticle4: false,
                }).onConflictDoUpdate({
                    target: properties.portalId,
                    set: { price: listing.price, title: listing.title, scrapedAt: new Date() }
                });

                console.log(`  ✓ ${listing.title} — £${listing.price.toLocaleString()}/mo (${listing.postcode ?? 'city centre'})`);
                totalUpserted++;
            } catch (err: any) {
                console.error(`  ✗ ${listing.portalId}: ${err.message?.split('\n')[0]}`);
            }
        }
    }

    const { sql: sqlTag } = await import('drizzle-orm');
    const count = await db.execute(sqlTag`SELECT COUNT(*) as count FROM properties`);
    const total = (count.rows[0] as any).count;
    console.log(`\n✅ Done! Upserted: ${totalUpserted} | Total in DB: ${total}`);
    process.exit(0);
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
