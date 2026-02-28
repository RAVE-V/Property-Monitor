import { chromium } from 'playwright-core';
import type { Property } from '../shared/types';

export async function scrapeZoopla(url: string): Promise<Property | null> {
  let browser;
  try {
    // Reverted camoufox usage to chromium as it failed to install from npm
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.waitForSelector('[data-testid="price"]', { timeout: 10000 });

    const data = await page.evaluate(() => {
      const priceText = document.querySelector('[data-testid="price"]')?.textContent || "0";
      const cleanPrice = parseInt(priceText.replace(/[^0-9]/g, "")) || 0;

      const title = document.querySelector('h1')?.textContent || "Zoopla Property";
      const bedsText = document.querySelector('[data-testid="bed-label"]')?.textContent || "0";
      const beds = parseInt(bedsText.replace(/[^0-9]/g, "")) || 0;
      const type = document.querySelector('[data-testid="property-type"]')?.textContent || "Unknown";

      // Phase 4: Extract "Listed on" date
      const listingHistory = document.querySelector('[data-testid="listing-history"]')?.textContent || "";
      const listedDateMatch = listingHistory.match(/Listed on (\d{1,2}(st|nd|rd|th)? \w+ \d{4})/);

      return {
        price: cleanPrice,
        title,
        beds,
        type,
        listedDateStr: listedDateMatch ? listedDateMatch[1] : null
      };
    });

    const portalId = url.split('details/').pop()?.split('/')[0] || 'unknown';

    // Parse date if found
    let firstSeenAt = new Date();
    if (data.listedDateStr) {
      const parsed = Date.parse(data.listedDateStr.replace(/(\d+)(st|nd|rd|th)/, '$1'));
      if (!isNaN(parsed)) firstSeenAt = new Date(parsed);
    }

    return {
      id: '',
      portalId: `zoopla-${portalId}`,
      url: url,
      title: data.title,
      price: data.price,
      bedrooms: data.beds,
      propertyType: data.type,
      location: { lng: -0.1276, lat: 51.5074 },
      scrapedAt: new Date(),
      // Phase 4 fields
      // @ts-ignore
      firstSeenAt,
      originalPrice: data.price, // Will be updated if price drop logic is added later
    };
  } catch (error) {
    console.error(`Zoopla scraping failed for ${url}:`, error);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}
