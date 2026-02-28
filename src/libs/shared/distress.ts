import { Property } from './types';

export function calculateDistress(property: Partial<Property>) {
  const now = new Date();
  const firstSeen = property.firstSeenAt ? new Date(property.firstSeenAt) : now;
  
  // Calculate days on market
  const diffTime = Math.abs(now.getTime() - firstSeen.getTime());
  const daysOnMarket = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Distress conditions
  const isOldListing = daysOnMarket > 60;
  const hasPriceDrop = property.originalPrice ? (property.price || 0) < property.originalPrice : false;
  
  const isTiredLandlord = isOldListing || hasPriceDrop;
  
  let distressReason = '';
  if (hasPriceDrop) distressReason = `Price dropped from £${property.originalPrice?.toLocaleString()}`;
  else if (isOldListing) distressReason = `On market for ${daysOnMarket} days`;

  return {
    isTiredLandlord,
    daysOnMarket,
    distressReason
  };
}
