const https = require('https');

https.get('https://www.zoopla.co.uk/to-rent/property/manchester/', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
    }
}, (res) => {
    let data = '';
    res.on('data', (d) => { data += d; });
    res.on('end', () => {
        console.log('Status code:', res.statusCode);
        if (data.includes('challenge-platform')) {
            console.log('Blocked by Cloudflare/Captcha');
        } else {
            console.log('Length:', data.length);
            const matches = data.match(/£\d+,\d+|£\d{3,}/g);
            console.log('Prices found:', matches ? matches.slice(0, 5) : 0);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
