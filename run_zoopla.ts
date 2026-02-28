import { scrapeZoopla } from './src/libs/scrapers/zoopla';

async function run() {
    console.log('Running Zoopla Scraper for UAT Test...');
    const url = 'https://www.zoopla.co.uk/to-rent/details/12345678/';
    const result = await scrapeZoopla(url);
    console.log('Scraper Output:\\n', JSON.stringify(result, null, 2));
}

run();
