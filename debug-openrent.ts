/**
 * debug-openrent.ts - Check what Playwright actually sees on OpenRent
 */
import { chromium } from 'playwright-core';
import * as fs from 'fs';

async function debug() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();

    try {
        await page.goto('https://www.openrent.co.uk/properties-to-rent/?term=london&min_beds=1&max_beds=8', {
            waitUntil: 'networkidle',
            timeout: 45000
        });

        // Check what's on the page
        const info = await page.evaluate(() => {
            return {
                title: document.title,
                url: location.href,
                bodyLength: document.body.innerText.length,
                pliCount: document.querySelectorAll('a.pli').length,
                propertyLinkCount: document.querySelectorAll('a[href^="/"]').length,
                // Grab first 300 chars of body text
                bodyStart: document.body.innerText.substring(0, 500),
                // Try to find any element with price-like content
                priceText: (() => {
                    const els = document.querySelectorAll('*');
                    const matches: string[] = [];
                    els.forEach(el => {
                        if (el.childElementCount === 0 && el.textContent?.includes('£') && el.textContent.includes('month')) {
                            matches.push(el.className + ': ' + el.textContent.trim().substring(0, 80));
                        }
                    });
                    return matches.slice(0, 5);
                })(),
                // find any data in a script tag that looks like property data
                scriptData: Array.from(document.querySelectorAll('script:not([src])')).
                    filter(s => s.textContent && s.textContent.includes('price')).
                    map(s => s.textContent!.substring(0, 300)).slice(0, 2),
            };
        });

        console.log('Page title:', info.title);
        console.log('URL:', info.url);
        console.log('Body length:', info.bodyLength);
        console.log('a.pli count:', info.pliCount);
        console.log('a[href^="/"] count:', info.propertyLinkCount);
        console.log('Body start:', info.bodyStart);
        console.log('Elements with £/month:', info.priceText);
        console.log('Script tags with price data:', info.scriptData);

        // Also dump a portion of the HTML to a file
        const html = await page.content();
        fs.writeFileSync('/tmp/openrent-debug.html', html.substring(0, 50000));
        console.log('\nHTML saved to /tmp/openrent-debug.html (first 50k chars)');

    } finally {
        await browser.close();
    }
}

debug().catch(console.error).finally(() => process.exit(0));
