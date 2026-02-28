/**
 * auto-refresh.ts
 * Background scheduler: scrapes all sources every 5 minutes.
 * Properties not seen in the latest batch are marked 'stale' (potential sold/removed).
 *
 * Run: npx tsx auto-refresh.ts
 * For production, wrap with pm2 or node-cron.
 */
import { chromium } from 'playwright-core';
import { db } from './src/libs/database/db.js';
import { properties } from './src/libs/database/schema.js';
import { sql, notInArray, eq, and } from 'drizzle-orm';
import 'dotenv/config';

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const CITIES = [
    { city: 'london', defaultLng: -0.1276, defaultLat: 51.5074 },
    { city: 'manchester', defaultLng: -2.2426, defaultLat: 53.4808 },
    { city: 'birmingham', defaultLng: -1.8904, defaultLat: 52.4862 },
    { city: 'leeds', defaultLng: -1.5491, defaultLat: 53.8008 },
    { city: 'bristol', defaultLng: -2.5879, defaultLat: 51.4545 },
];

async function geocode(postcode: string): Promise<{ lat: number; lng: number } | null> {
    if (!postcode) return null;
    const clean = postcode.trim().toUpperCase().replace(/\s+/g, '');
    try {
        const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
        if (res.ok) {
            const j = await res.json() as any;
            if (j.status === 200 && j.result) return { lat: j.result.latitude, lng: j.result.longitude };
        }
        // Outward code fallback
        const outward = clean.replace(/\d[A-Z]{2}$/, '').trim();
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

async function scrapeOpenRentCity(city: string, defaultLng: number, defaultLat: number) {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });
    const page = await ctx.newPage();
    const results: string[] = []; // portalIds seen this run
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
            const price = parseInt(item.priceText.replace(/[^0-9]/g, '')) || 0;
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

            const portalId = `openrent-${item.id}`;
            results.push(portalId);

            const locSql = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)` as any;
            await db.insert(properties).values({
                portalId, source: 'openrent', url: `https://www.openrent.co.uk${item.href}`,
                title, price, bedrooms: beds, propertyType, location: locSql,
                originalPrice: price, scrapedAt: new Date(), firstSeenAt: new Date(),
                timeOnMarket: 0, isTiredLandlord: false, isArticle4: false,
                status: 'active',
            } as any).onConflictDoUpdate({
                target: properties.portalId,
                set: { price, title, scrapedAt: new Date(), status: 'active' } as any,
            });
        }
    } catch (err) { console.error(`[OpenRent] ${city}:`, err); }
    finally { await browser.close(); }
    return results;
}

async function runRefreshCycle() {
    const runAt = new Date().toISOString();
    console.log(`\n🔄 [${runAt}] Starting refresh cycle...`);

    const seenPortalIds: string[] = [];

    for (const target of CITIES) {
        console.log(`  📍 Scraping ${target.city}...`);
        const ids = await scrapeOpenRentCity(target.city, target.defaultLng, target.defaultLat);
        seenPortalIds.push(...ids);
        console.log(`  ✓ ${target.city}: ${ids.length} active listings`);
    }

    // Mark properties from openrent that WEREN'T seen this run as 'stale' (potential sold/removed)
    if (seenPortalIds.length > 0) {
        const staleResult = await db.update(properties)
            .set({ status: 'stale' } as any)
            .where(
                and(
                    eq(properties.source, 'openrent'),
                    notInArray(properties.portalId, seenPortalIds)
                )
            );
        console.log(`  ⚠️  Marked stale (potential sold/removed): ${(staleResult as any).rowCount ?? '?'} properties`);
    }

    const count = await db.execute(sql`SELECT COUNT(*) as c, status FROM properties GROUP BY status`);
    console.log(`  📊 DB state:`, count.rows.map((r: any) => `${r.status}:${r.c}`).join(' | '));
    console.log(`✅ Refresh complete. Next run in 5 minutes.`);
}

// Run immediately then every 5 minutes
await runRefreshCycle();
setInterval(runRefreshCycle, INTERVAL_MS);

// Keep alive
console.log('\n⏰ Auto-refresh scheduler running. Press Ctrl+C to stop.');
