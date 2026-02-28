import { db } from '../database/db';
import { demandPoints } from '../database/schema';

/**
 * Mocks SA demand data for hotspots.
 */
export async function seedMockDemandData() {
  const points = [
    { lng: -0.1276, lat: 51.5074, occupancy: 85, source: 'airbnb' }, // London
    { lng: -0.11, lat: 51.52, occupancy: 70, source: 'airbnb' },
    { lng: -1.8904, lat: 52.4862, occupancy: 65, source: 'airbnb' }, // Birmingham
    { lng: -2.2426, lat: 53.4808, occupancy: 75, source: 'airbnb' }, // Manchester
    { lng: -3.1883, lat: 55.9533, occupancy: 90, source: 'airbnb' }, // Edinburgh
  ];

  for (const p of points) {
    await db.insert(demandPoints).values({
      location: [p.lng, p.lat],
      occupancy: p.occupancy,
      source: p.source,
    });
  }

  return true;
}
