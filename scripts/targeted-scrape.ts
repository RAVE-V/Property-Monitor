import { chromium } from 'playwright-core';
import { db } from '../src/libs/database/db.js';
import { properties } from '../src/libs/database/schema.js';
import { sql } from 'drizzle-orm';
import fetch from 'node-fetch'; // Polyfill if needed

// Just re-implementing briefly to trace where it fails

interface Listing {
    portalId: string; url: string; source: string;
    title: string; price: number; bedrooms: number;
    propertyType: string; postcode: string | null; lat: number; lng: number;
}

// ─── Zoopla ───────────────────────────────────────────────────────────────────
async function scrapeZooplaCity(city: string, defaultLng: number, defaultLat: number): Promise<Listing[]> {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    const results: Listing[] = [];

    try {
        await page.goto(`https://www.zoopla.co.uk/to-rent/property/${encodeURIComponent(city)}/`, {
            waitUntil: 'domcontentloaded', timeout: 30000,
        });
        await page.waitForTimeout(3000);

        const selectorFound = await Promise.race([
            page.waitForSelector('[data-testid="search-result"]', { timeout: 8000 }).then(() => '[data-testid="search-result"]'),
            page.waitForSelector('div[id^="listing_"]', { timeout: 8000 }).then(() => 'div[id^="listing_"]'),
            new Promise<string>(resolve => setTimeout(() => resolve(''), 9000)),
        ]);

        if (!selectorFound) {
            console.warn(`  [Zoopla] ${city}: No listing selectors found, skipping`);
            await browser.close();
            return results;
        }

        const raw = await page.evaluate((sel) => {
            const cards = document.querySelectorAll(sel);
            const out: any[] = [];
            cards.forEach(card => {
                const link = card.querySelector('a[href*="/to-rent/details/"]') as HTMLAnchorElement | null;
                if (!link) return;
                const href = link.href;
                const idMatch = href.match(/\/details\/(\d+)/) || card.id?.match(/listing_(\d+)/);
                const id = idMatch ? idMatch[1] : '';

                const priceEl = card.querySelector('[data-testid="listing-price"], .listing-results-price');
                const priceText = priceEl?.textContent?.trim() || '';

                const titleEl = card.querySelector('[data-testid="listing-title"], h2');
                const title = titleEl?.textContent?.trim() || '';

                out.push({ id, href, priceText, title, innerText: (card as HTMLElement).innerText });
            });
            return out;
        }, selectorFound);

        for (const item of raw.slice(0, 30)) {
            if (!item.id || !item.priceText) continue;
            results.push({
                portalId: `zoopla-${item.id}`, url: item.href,
                source: 'zoopla', title: item.title || `Zoopla Property`,
                price: parseInt(item.priceText.replace(/[^0-9]/g, "")) || 0,
                bedrooms: 1, propertyType: 'Property', postcode: null, lat: defaultLat, lng: defaultLng,
            });
        }
    } catch (err: any) { console.warn(`  [Zoopla] ${city} error:`, err.message?.split('\n')[0]); }
    finally { await browser.close(); }
    return results;
}

// ─── OnTheMarket ─────────────────────────────────────────────────────────────
async function scrapeOTMCity(city: string, defaultLng: number, defaultLat: number): Promise<Listing[]> {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    const results: Listing[] = [];

    try {
        await page.goto(`https://www.onthemarket.com/to-rent/property/${encodeURIComponent(city)}/`, {
            waitUntil: 'domcontentloaded', timeout: 30000,
        });
        await page.waitForTimeout(3000);
        const selectorFound = await Promise.race([
            page.waitForSelector('li.otm-PropertyCard', { timeout: 8000 }).then(() => 'li.otm-PropertyCard'),
            page.waitForSelector('[data-testid="property-card"]', { timeout: 8000 }).then(() => '[data-testid="property-card"]'),
            page.waitForSelector('[data-testid="result-card"]', { timeout: 8000 }).then(() => '[data-testid="result-card"]'),
            page.waitForSelector('.property-result', { timeout: 8000 }).then(() => '.property-result'),
            page.waitForSelector('li[class*="result"]', { timeout: 8000 }).then(() => 'li[class*="result"]'),
            page.waitForSelector('article', { timeout: 8000 }).then(() => 'article'),
            new Promise<string>(resolve => setTimeout(() => resolve(''), 9000)),
        ]);

        if (!selectorFound) {
            console.warn(`  [OnTheMarket] ${city}: No listing selectors found, skipping`);
            await browser.close();
            return results;
        }

        const raw = await page.evaluate((sel) => {
            const cards = document.querySelectorAll(sel);
            const out: any[] = [];
            cards.forEach(card => {
                const link = (card.querySelector('a[href*="/details/"], a[href*="/property/"]') || card.querySelector('a')) as HTMLAnchorElement | null;
                if (!link) return;
                const href = link.href;
                const idMatch = href.match(/\/(?:details|property)\/(?:to-rent\/)?([^/?#]+)/);
                const id = idMatch ? idMatch[1] : '';
                const priceEl = card.querySelector('[class*="price"], [data-testid*="price"], span[class*="Price"]');
                const priceText = priceEl?.textContent?.trim() || '';
                const titleEl = card.querySelector('h2, h3, [class*="address"], [class*="title"], [data-testid*="address"], address');
                const title = titleEl?.textContent?.trim() || '';
                out.push({ id, href, priceText, title, innerText: (card as HTMLElement).innerText });
            });
            return out;
        }, selectorFound);

        for (const item of raw.slice(0, 30)) {
            if (!item.id || !item.priceText) continue;
            results.push({
                portalId: `otm-${item.id}`, url: item.href,
                source: 'onthemarket', title: item.title,
                price: parseInt(item.priceText.replace(/[^0-9]/g, "")) || 0,
                bedrooms: 1, propertyType: 'Property',
                postcode: null, lat: defaultLat, lng: defaultLng,
            });
        }
    } catch (err: any) {
        console.warn(`  [OTM] ${city}: scraper failed (${err.message?.split('\n')[0] || err})`);
    }
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

async function run() {
    console.log('Running quick targeted scrape for Zoopla and OTM in Manchester...');
    const zResults = await scrapeZooplaCity('manchester', -2.2426, 53.4808);
    console.log(`Zoopla extracted: ${zResults.length}`);
    for (const r of zResults) await upsert(r);

    const oResults = await scrapeOTMCity('manchester', -2.2426, 53.4808);
    console.log(`OTM extracted: ${oResults.length}`);
    for (const r of oResults) await upsert(r);

    process.exit(0);
}

run();
