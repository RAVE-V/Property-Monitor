/**
 * debug2-openrent.ts - Quick test of selectors with networkidle
 * Run: npx tsx debug2-openrent.ts
 */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
});
const page = await ctx.newPage();
await page.goto('https://www.openrent.co.uk/properties-to-rent/?term=london&min_beds=1&max_beds=8', {
    waitUntil: 'networkidle', timeout: 45000
});

const result = await page.evaluate(() => {
    const cards = document.querySelectorAll('a.pli');
    const data: any[] = [];
    cards.forEach(c => {
        const href = c.getAttribute('href') || '';
        const price = c.querySelector('.price')?.textContent?.trim() || '';
        const title = c.querySelector('.prop-title')?.textContent?.trim() || '';
        const beds = c.querySelector('.features li')?.textContent?.trim() || '';
        data.push({ href, price, title, beds });
    });
    return data.slice(0, 5);
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(0);
