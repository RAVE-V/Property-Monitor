import { chromium } from 'playwright-core';
import type { Property } from '../shared/types';

export async function scrapeSpareRoom(url: string): Promise<Property | null> {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for the main price or similar element
    await page.waitForSelector('.listing-header', { timeout: 10000 });

    const data = await page.evaluate(() => {
      // SpareRoom often uses a "PCM" or "pw" price format
      const priceElement = document.querySelector('.listing-price');
      const priceText = priceElement?.textContent || "0";

      let cleanPrice = parseInt(priceText.replace(/[^0-9]/g, "")) || 0;

      // If price is per week, normalize to PCM (standard for Rent-to-Rent)
      if (priceText.toLowerCase().includes('pw')) {
        cleanPrice = Math.round((cleanPrice * 52) / 12);
      }

      const title = document.querySelector('.listing-title')?.textContent || "SpareRoom Property";
      const locationText = document.querySelector('.listing-location')?.textContent || "";

      return { price: cleanPrice, title, locationText };
    });

    const flatId = url.split('flat_id=')[1]?.split('&')[0] || 'unknown';

    return {
      id: '',
      portalId: `spareroom-${flatId}`,
      url: url,
      title: data.title,
      price: data.price,
      bedrooms: 1, // Usually per-room on SpareRoom, need deeper logic for whole-flat
      propertyType: "Room/Flat",
      location: { lng: -0.1276, lat: 51.5074 }, // Default to London
      scrapedAt: new Date(),
    };
  } catch (error) {
    console.error(`SpareRoom scraping failed for ${url}:`, error);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}
