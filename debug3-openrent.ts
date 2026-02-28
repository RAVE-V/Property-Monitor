/**
 * debug3-openrent.ts - Dump actual pli card HTML to inspect selectors
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
    const first = cards[0] as HTMLElement | undefined;
    if (!first) return { count: 0, html: '' };
    return {
        count: cards.length,
        html: first.outerHTML,
        innerText: first.innerText,
        allClasses: Array.from(first.querySelectorAll('*')).map(el => ({
            tag: el.tagName,
            cls: el.className,
            text: (el as HTMLElement).innerText?.trim()?.substring(0, 60)
        })).filter(x => x.text)
    };
});

console.log('Card count:', (result as any).count);
console.log('\nFirst card innerText:');
console.log((result as any).innerText?.substring(0, 500));
console.log('\nAll elements with text:');
console.log(JSON.stringify((result as any).allClasses?.slice(0, 15), null, 2));

await browser.close();
process.exit(0);
