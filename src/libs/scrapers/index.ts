import { scrapeOpenRent } from './openrent';
import { scrapeZoopla } from './zoopla';
import { scrapeSpareRoom } from './spareroom';
import { scrapeOnTheMarket } from './onthemarket';
import type { Property } from '../shared/types';

export async function scrapeProperty(url: string): Promise<Property | null> {
  if (url.includes('openrent.co.uk')) {
    return scrapeOpenRent(url);
  } else if (url.includes('zoopla.co.uk')) {
    return scrapeZoopla(url);
  } else if (url.includes('spareroom.co.uk')) {
    return scrapeSpareRoom(url);
  } else if (url.includes('onthemarket.com')) {
    return scrapeOnTheMarket(url);
  }
  
  console.warn(`No scraper found for URL: ${url}`);
  return null;
}

export { scrapeOpenRent, scrapeZoopla, scrapeSpareRoom };
