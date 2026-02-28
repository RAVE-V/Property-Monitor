import { chromium } from 'playwright-core';
import type { Property } from '../shared/types';

export async function scrapeOnTheMarket(url: string): Promise<Property | null> {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for the main price or container
    await page.waitForSelector('.otm-Price', { timeout: 10000 });

    const data = await page.evaluate(() => {
      const priceText = document.querySelector('.otm-Price')?.textContent || "0";
      const cleanPrice = parseInt(priceText.replace(/[^0-9]/g, "")) || 0;

      const title = document.querySelector('h1')?.textContent || "OnTheMarket Property";

      // OTM often puts beds in a specific icon label or property details
      const bedsMatch = document.body.innerText.match(/(\d+)\s*bedrooms?/i);
      const beds = bedsMatch ? parseInt(bedsMatch[1] || "0") : 0;

      const typeMatch = document.body.innerText.match(/(Detached|Semi-detached|Terraced|Flat|Maisonette|Bungalow)/i);
      const type = typeMatch ? typeMatch[1] || null : null;

      // Distress Data: Look for "Added on" or similar
      const addedMatch = document.body.innerText.match(/Added on (\d{1,2}\/\d{1,2}\/\d{4})/i);

      return {
        price: cleanPrice,
        title,
        beds,
        type,
        addedDateStr: addedMatch ? addedMatch[1] : null
      };
    });

    const otmId = url.split('details/').pop()?.split('/')[0] || 'unknown';

    let firstSeenAt = new Date();
    if (data.addedDateStr) {
      const [day, month, year] = data.addedDateStr.split('/');
      const parsed = new Date(parseInt(year || "0"), parseInt(month || "1") - 1, parseInt(day || "1"));
      if (!isNaN(parsed.getTime())) firstSeenAt = parsed;
    }

    return {
      id: '',
      portalId: `otm-${otmId}`,
      url: url,
      title: data.title,
      price: data.price,
      bedrooms: data.beds,
      propertyType: data.type,
      location: { lng: -0.1276, lat: 51.5074 },
      scrapedAt: new Date(),
      firstSeenAt,
      originalPrice: data.price,
    };
  } catch (error) {
    console.error(`OnTheMarket scraping failed for ${url}:`, error);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}
