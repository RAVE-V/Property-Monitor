import { chromium } from 'playwright-core';
import fs from 'fs';

async function dumpHTML() {
    const browser = await chromium.launch({ headless: true });

    // OTM
    const ctxOtm = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
    const pageOtm = await ctxOtm.newPage();
    console.log('Testing OTM...');
    await pageOtm.goto(`https://www.onthemarket.com/to-rent/property/london/`, { waitUntil: 'domcontentloaded' });
    await pageOtm.waitForTimeout(5000);
    fs.writeFileSync('otm-body.html', await pageOtm.content());
    await ctxOtm.close();

    // Zoopla
    const ctxZ = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
    const pageZ = await ctxZ.newPage();
    console.log('Testing Zoopla...');
    await pageZ.goto(`https://www.zoopla.co.uk/to-rent/property/london/`, { waitUntil: 'domcontentloaded' });
    await pageZ.waitForTimeout(5000);
    fs.writeFileSync('zoopla-body.html', await pageZ.content());
    await ctxZ.close();

    await browser.close();
}
dumpHTML();
