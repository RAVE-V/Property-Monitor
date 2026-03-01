/**
 * scrape-all-live.ts
 * Multi-source property scraper: OpenRent, OnTheMarket, SpareRoom
 * All results are geocoded via postcodes.io and upserted to the properties table.
 *
 * Run: npx tsx scrape-all-live.ts
 */
import { chromium } from 'playwright-core';
import { db } from '../src/libs/database/db.js';
import { properties } from '../src/libs/database/schema.js';
import { sql } from 'drizzle-orm';

const CITIES = [
    { city: 'london', label: 'London', defaultLng: -0.1276, defaultLat: 51.5074 },
    { city: 'manchester', label: 'Manchester', defaultLng: -2.2426, defaultLat: 53.4808 },
    { city: 'birmingham', label: 'Birmingham', defaultLng: -1.8904, defaultLat: 52.4862 },
    { city: 'leeds', label: 'Leeds', defaultLng: -1.5491, defaultLat: 53.8008 },
    { city: 'bristol', label: 'Bristol', defaultLng: -2.5879, defaultLat: 51.4545 },
    // Scotland
    { city: 'edinburgh', label: 'Edinburgh', defaultLng: -3.1883, defaultLat: 55.9533 },
    { city: 'glasgow', label: 'Glasgow', defaultLng: -4.2518, defaultLat: 55.8642 },
    { city: 'aberdeen', label: 'Aberdeen', defaultLng: -2.0943, defaultLat: 57.1497 },
    { city: 'dundee', label: 'Dundee', defaultLng: -2.9707, defaultLat: 56.4620 },
    // North England
    { city: 'newcastle', label: 'Newcastle', defaultLng: -1.6178, defaultLat: 54.9783 },
    { city: 'sheffield', label: 'Sheffield', defaultLng: -1.4701, defaultLat: 53.3811 },
    { city: 'liverpool', label: 'Liverpool', defaultLng: -2.9916, defaultLat: 53.4084 },
    // Midlands / East
    { city: 'nottingham', label: 'Nottingham', defaultLng: -1.1581, defaultLat: 52.9548 },
    // Wales
    { city: 'cardiff', label: 'Cardiff', defaultLng: -3.1791, defaultLat: 51.4816 },
    // Northern Ireland
    { city: 'belfast', label: 'Belfast', defaultLng: -5.9301, defaultLat: 54.5973 },
];

interface Listing {
    portalId: string; url: string; source: string;
    title: string; price: number; bedrooms: number;
    propertyType: string; postcode: string | null; lat: number; lng: number;
}

// Geocode via postcodes.io — supports both full postcodes and outward district codes (e.g. SW6, M2)
async function geocode(postcode: string): Promise<{ lat: number; lng: number } | null> {
    if (!postcode) return null;
    const clean = postcode.trim().toUpperCase().replace(/\s+/g, '');
    try {
        // Try full postcode first
        const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
        if (res.ok) {
            const j = await res.json() as any;
            if (j.status === 200 && j.result) return { lat: j.result.latitude, lng: j.result.longitude };
        }
        // Fallback: outward code (district) lookup e.g. SW6, M1, LS1
        const outward = clean.replace(/\d[A-Z]{2}$/, '').trim() || clean.slice(0, -3).trim() || clean;
        if (outward.length >= 2) {
            const res2 = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(outward)}`);
            if (res2.ok) {
                const j2 = await res2.json() as any;
                if (j2.status === 200 && j2.result) return { lat: j2.result.latitude, lng: j2.result.longitude };
            }
        }
        return null;
    } catch { return null; }
}

function extractPostcode(text: string): string {
    const m = text.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i)
        || text.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?)\b/i);
    return m ? m[1]!.trim().toUpperCase() : '';
}

/**
 * Robustly extract a price from a price string and normalise to PCM.
 * Handles:
 *  - "£1,200 pcm" => 1200
 *  - "£300 pw" => 1300 (×52/12)
 *  - "£300 per week" => 1300
 *  - "£1200" => 1200 (assumed pcm if >= 300, else treated as pw)
 */
function extractPCM(priceText: string, fullText = ''): number {
    const combined = (priceText + ' ' + fullText).toLowerCase();
    // Find all numbers in the price element text (avoid multi-digit codes)
    const nums = priceText.replace(/,/g, '').match(/\d{2,6}/g)?.map(Number) ?? [];
    if (!nums.length) return 0;

    // Pick the most likely price: first number in the typical rent range (100-10000)
    const rawPrice = nums.find(n => n >= 100 && n <= 10000) ?? nums[0] ?? 0;
    if (!rawPrice) return 0;

    const isPW = /\bpw\b|per\s*week|weekly/i.test(combined);
    const isPCM = /\bpcm\b|per\s*month|monthly/i.test(combined);

    if (isPW) return Math.round((rawPrice * 52) / 12);
    if (isPCM) return rawPrice;
    // Heuristic: weekly rents are usually < 700 in the UK
    if (rawPrice < 700 && !isPCM) return Math.round((rawPrice * 52) / 12);
    return rawPrice;
}

// ─── OpenRent ─────────────────────────────────────────────────────────────────
async function scrapeOpenRentCity(city: string, defaultLng: number, defaultLat: number): Promise<Listing[]> {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    const results: Listing[] = [];

    try {
        await page.goto(`https://www.openrent.co.uk/properties-to-rent/?term=${encodeURIComponent(city)}&min_beds=1&max_beds=8&min_price=500&max_price=5000`, {
            waitUntil: 'networkidle', timeout: 45000,
        });
        await page.waitForSelector('a.pli', { timeout: 10000 });

        const raw = await page.evaluate(() => {
            const cards = document.querySelectorAll<HTMLAnchorElement>('a.pli');
            const out: any[] = [];
            cards.forEach(c => {
                const href = c.getAttribute('href') || '';
                const idMatch = href.match(/\/(\d+)(?:\/|$)/);
                if (!idMatch) return;
                let priceText = '';
                c.querySelectorAll('span').forEach(s => {
                    if (s.textContent?.trim().startsWith('£') && s.textContent.length < 20) priceText = s.textContent.trim();
                });
                out.push({ id: idMatch[1], href, priceText, innerText: (c as HTMLElement).innerText });
            });
            return out;
        });

        for (const item of raw.slice(0, 40)) {
            const price = extractPCM(item.priceText, item.innerText);
            if (!price) continue;
            const lines = item.innerText.split('\n').map((l: string) => l.trim()).filter(Boolean);
            let title = '';
            for (const line of lines) {
                if (/^\d+\s*(Bed|Room|Studio)/i.test(line) || /^Room in/i.test(line) || /^Studio/i.test(line)) {
                    title = line; break;
                }
            }
            if (!title) continue;
            const postcode = extractPostcode(title + ' ' + item.innerText);
            const bedMatch = title.match(/(\d+)\s*Bed/i);
            const beds = bedMatch ? parseInt(bedMatch[1]!) : (title.toLowerCase().includes('studio') ? 0 : 1);
            const typeMatch = title.match(/\d+\s*Bed\s+(\w+)/i) || title.match(/^(Studio|Room|Flat|House|Apartment)/i);
            const propertyType = typeMatch ? typeMatch[1]! : 'Property';
            let lat = defaultLat, lng = defaultLng;
            if (postcode) { const geo = await geocode(postcode); if (geo) { lat = geo.lat; lng = geo.lng; } }
            results.push({
                portalId: `openrent-${item.id}`, url: `https://www.openrent.co.uk${item.href}`,
                source: 'openrent', title, price, bedrooms: beds, propertyType, postcode: postcode || null, lat, lng,
            });
        }
    } catch (err) { console.error(`  [OpenRent] ${city} error:`, err); }
    finally { await browser.close(); }
    return results;
}

// ─── OnTheMarket ─────────────────────────────────────────────────────────────
async function scrapeOTMCity(city: string, defaultLng: number, defaultLat: number): Promise<Listing[]> {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    const results: Listing[] = [];

    try {
        await page.goto(`https://www.onthemarket.com/to-rent/property/${encodeURIComponent(city)}/`, {
            waitUntil: 'networkidle', timeout: 45000,
        });
        await page.waitForSelector('[data-testid="listing-card"], .listing-card, article', { timeout: 12000 });

        const raw = await page.evaluate(() => {
            const cards = document.querySelectorAll('[data-testid="listing-card"], article.result, li.result');
            const out: any[] = [];
            cards.forEach(card => {
                const link = card.querySelector('a[href*="/property/"]') as HTMLAnchorElement | null;
                if (!link) return;
                const href = link.href;
                const idMatch = href.match(/\/property\/(?:to-rent\/)?([^/?]+)/);
                const id = idMatch ? idMatch[1] : '';
                // Price
                const priceEl = card.querySelector('[class*="price"], [data-testid="price"]');
                const priceText = priceEl?.textContent?.trim() || '';
                // Title / address
                const titleEl = card.querySelector('h2, h3, [class*="address"], [class*="title"], [data-testid="address"]');
                const title = titleEl?.textContent?.trim() || '';
                // Beds
                const bedsEl = card.querySelector('[class*="bed"], [data-testid="beds"]');
                const bedsText = bedsEl?.textContent?.trim() || '';
                out.push({ id, href, priceText, title, bedsText, innerText: (card as HTMLElement).innerText });
            });
            return out;
        });

        console.log(`  [OnTheMarket] ${city}: ${raw.length} raw cards`);

        for (const item of raw.slice(0, 30)) {
            const price = extractPCM(item.priceText, item.innerText);
            if (!price || !item.title) continue;
            const postcode = extractPostcode(item.title + ' ' + item.innerText);
            const bedMatch = (item.bedsText + item.title).match(/(\d+)\s*[Bb]ed/);
            const beds = bedMatch ? parseInt(bedMatch[1]!) : 1;
            const typeMatch = item.title.match(/\d+\s*[Bb]ed\s+(\w+)/) || item.title.match(/^(Studio|Flat|House|Apartment|Room)/i);
            const propertyType = typeMatch ? typeMatch[1]! : 'Property';
            let lat = defaultLat, lng = defaultLng;
            if (postcode) { const geo = await geocode(postcode); if (geo) { lat = geo.lat; lng = geo.lng; } }
            if (!item.id) continue;
            results.push({
                portalId: `otm-${item.id}`, url: item.href,
                source: 'onthemarket', title: item.title, price, bedrooms: beds, propertyType,
                postcode: postcode || null, lat, lng,
            });
        }
    } catch (err) { console.error(`  [OTM] ${city} error:`, err); }
    finally { await browser.close(); }
    return results;
}

// ─── SpareRoom ────────────────────────────────────────────────────────────────
async function scrapeSpareRoomCity(city: string, defaultLng: number, defaultLat: number): Promise<Listing[]> {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    const results: Listing[] = [];

    try {
        await page.goto(`https://www.spareroom.co.uk/flatshare/${encodeURIComponent(city)}`, {
            waitUntil: 'networkidle', timeout: 45000,
        });
        await page.waitForSelector('article, .listicle-item, .listing-result', { timeout: 12000 });

        const raw = await page.evaluate(() => {
            const cards = document.querySelectorAll('article, li.panel-listing-result, .listing-result');
            const out: any[] = [];
            cards.forEach(card => {
                const link = card.querySelector('a[href*="flatshare"]') as HTMLAnchorElement | null;
                if (!link) return;
                const href = link.href.startsWith('http') ? link.href : `https://www.spareroom.co.uk${link.getAttribute('href')}`;
                const idMatch = href.match(/flatid=(\d+)/i) || href.match(/\/(\d+)(?:\?|$)/);
                const id = idMatch ? idMatch[1] : '';
                const priceEl = card.querySelector('[class*="price"], strong');
                const priceText = priceEl?.textContent?.trim() || '';
                const titleEl = card.querySelector('h2, h3, [class*="title"], [class*="heading"]');
                const title = (titleEl?.textContent?.trim() || card.querySelector('a')?.textContent?.trim() || '').replace(/\s+/g, ' ');
                out.push({ id, href, priceText, title, innerText: (card as HTMLElement).innerText });
            });
            return out;
        });

        console.log(`  [SpareRoom] ${city}: ${raw.length} raw cards`);

        for (const item of raw.slice(0, 30)) {
            if (!item.id || !item.priceText) continue;
            const price = extractPCM(item.priceText, item.innerText);
            if (!price) continue;
            const postcode = extractPostcode(item.title + ' ' + item.innerText);
            let lat = defaultLat, lng = defaultLng;
            if (postcode) { const geo = await geocode(postcode); if (geo) { lat = geo.lat; lng = geo.lng; } }
            results.push({
                portalId: `spareroom-${item.id}`, url: item.href,
                source: 'spareroom', title: item.title || `SpareRoom Room, ${city}`,
                price, bedrooms: 1, propertyType: 'Room', postcode: postcode || null, lat, lng,
            });
        }
    } catch (err) { console.error(`  [SpareRoom] ${city} error:`, err); }
    finally { await browser.close(); }
    return results;
}

// ─── Upsert to DB ─────────────────────────────────────────────────────────────
async function upsert(listing: Listing): Promise<boolean> {
    try {
        const locSql = sql`ST_SetSRID(ST_MakePoint(${listing.lng}, ${listing.lat}), 4326)` as any;
        await db.insert(properties).values({
            portalId: listing.portalId, source: listing.source, url: listing.url,
            title: listing.title, price: listing.price, bedrooms: listing.bedrooms,
            propertyType: listing.propertyType, location: locSql,
            originalPrice: listing.price, scrapedAt: new Date(), firstSeenAt: new Date(),
            timeOnMarket: 0, isTiredLandlord: false, isArticle4: false,
        }).onConflictDoUpdate({
            target: properties.portalId,
            set: { price: listing.price, title: listing.title, scrapedAt: new Date() },
        });
        return true;
    } catch (err: any) {
        console.error(`  ✗ ${listing.portalId}: ${err.message?.split('\n')[0]}`);
        return false;
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
    console.log('\n🏠 Multi-Source Property Scraper (OpenRent + OnTheMarket + SpareRoom)\n');
    const sources = [
        { name: 'OpenRent', fn: scrapeOpenRentCity },
        { name: 'OnTheMarket', fn: scrapeOTMCity },
        { name: 'SpareRoom', fn: scrapeSpareRoomCity },
    ];

    let total = 0;
    for (const source of sources) {
        console.log(`\n══ ${source.name} ══`);
        for (const target of CITIES) {
            console.log(`\n📍 ${target.label}...`);
            try {
                const listings = await source.fn(target.city, target.defaultLng, target.defaultLat);
                console.log(`  Parsed ${listings.length} listings`);
                for (const l of listings) {
                    const ok = await upsert(l);
                    if (ok) {
                        console.log(`  ✓ [${l.source}] ${l.title} — £${l.price.toLocaleString()}/mo (${l.postcode ?? 'city'})`);
                        total++;
                    }
                }
            } catch (err: any) {
                console.error(`  [${source.name}] Fatal error for ${target.label}:`, err.message || err);
                console.log(`  Skipping ${target.label} and continuing...`);
            }
        }
    }

    const { sql: sqlTag } = await import('drizzle-orm');
    const count = await db.execute(sqlTag`SELECT COUNT(*) as count FROM properties`);
    console.log(`\n✅ All done! Upserted: ${total} | Total in DB: ${(count.rows[0] as any).count}`);
    process.exit(0);
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
