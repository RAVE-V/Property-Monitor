const fs = require('fs');

async function testFetch() {
    console.log('Fetching Zoopla...');
    try {
        const res = await fetch('https://www.zoopla.co.uk/to-rent/property/manchester/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-GB,en;q=0.9',
            }
        });
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Length:', text.length);
        if (text.includes('Cloudflare') || text.includes('captcha') || res.status === 403) {
            console.log('Blocked by WAF');
        } else {
            console.log('Success! Saving to text');
            fs.writeFileSync('zoopla-fetch.html', text);
        }
    } catch (e) {
        console.error(e);
    }
}
testFetch();
