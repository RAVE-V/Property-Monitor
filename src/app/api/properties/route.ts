import { NextResponse, NextRequest } from 'next/server';
import { db } from '../../../libs/database/db';
import { properties } from '../../../libs/database/schema';
import { sql, and, gte, lte, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bboxStr = searchParams.get('bbox');
  const allMode = searchParams.get('all') === 'true' || !bboxStr;
  const minPrice = Number(searchParams.get('minPrice')) || 0;
  const maxPrice = Number(searchParams.get('maxPrice')) || 5000000;
  const isDistressed = searchParams.get('isTiredLandlord') === 'true';
  const tenure = searchParams.get('tenure');
  const minBedrooms = Number(searchParams.get('minBedrooms')) || 0;
  const propertyType = searchParams.get('propertyType');

  let conditions: any[] = [
    gte(properties.price, minPrice),
    lte(properties.price, maxPrice),
    // Only return active properties on map (stale/sold kept in DB for history)
    sql`(${properties.status} IS NULL OR ${properties.status} = 'active')`
  ];

  if (isDistressed) {
    conditions.push(eq(properties.isTiredLandlord, true));
  }

  if (minBedrooms > 0) {
    conditions.push(gte(properties.bedrooms, minBedrooms));
  }

  if (propertyType && propertyType !== '') {
    // Basic ilike match, e.g., 'Flat' matches 'Flat', 'Studio Flat', etc.
    conditions.push(sql`${properties.propertyType} ILIKE ${'%' + propertyType + '%'}`);
  }

  if (tenure && tenure !== '') {
    // If tenure is specified as 'rent' or 'sale', filter by it
    conditions.push(eq(properties.tenure, tenure));
  }

  // Only apply bbox filter when explicitly requested and not in allMode
  if (bboxStr && !allMode) {
    const [minLng, minLat, maxLng, maxLat] = bboxStr.split(',').map(Number);
    conditions.push(sql`ST_Within(${properties.location}, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))`);
  }

  try {
    const data = await db.select().from(properties).where(and(...conditions));

    const geoJson = {
      type: 'FeatureCollection',
      features: data.map(p => {
        // Handle Drizzle PostGIS point array [lng, lat] vs raw object { coordinates: ... }
        const loc = p.location as any;
        const coords = Array.isArray(loc) ? loc : loc?.coordinates || [-0.1276, 51.5074];
        const portalSource = p.portalId.split('-')[0];

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coords
          },
          properties: {
            id: p.id,
            portalId: p.portalId,
            source: portalSource,
            title: p.title,
            price: p.price,
            bedrooms: p.bedrooms,
            propertyType: p.propertyType,
            url: p.url,
            isArticle4: p.isArticle4,
            isTiredLandlord: p.isTiredLandlord,
            timeOnMarket: p.timeOnMarket,
            originalPrice: p.originalPrice,
            scrapedAt: p.scrapedAt,
            firstSeenAt: p.firstSeenAt,
            status: p.status,
            tenure: p.tenure,
            // @ts-ignore
            imageUrl: p.rawData?.imageUrl || null,
            // @ts-ignore
            planningIndicators: p.rawData?.planningIndicators || []
          }
        };
      })
    };

    return NextResponse.json(geoJson);
  } catch (error: any) {
    console.warn('Database connection failed, using static mock telemetry for testing.');

    const mockData = [
      { id: 'mock-1', portalId: 'openrent-1', source: 'openrent', title: 'OpenRent HMO Lead', price: 2200, bedrooms: 5, propertyType: 'House', location: [-0.1276, 51.5074], isArticle4: true, isTiredLandlord: true, timeOnMarket: 90 },
      { id: 'mock-2', portalId: 'zoopla-1', source: 'zoopla', title: 'Zoopla Strategic Asset', price: 3500, bedrooms: 3, propertyType: 'Flat', location: [-0.1176, 51.5174], isArticle4: false, isTiredLandlord: false, timeOnMarket: 10 },
      { id: 'mock-3', portalId: 'spareroom-1', source: 'spareroom', title: 'SpareRoom Target', price: 850, bedrooms: 1, propertyType: 'Room', location: [-0.1376, 51.4974], isArticle4: false, isTiredLandlord: false, timeOnMarket: 5 },
      { id: 'mock-4', portalId: 'otm-1', source: 'otm', title: 'OTM Distressed Terraced', price: 1800, bedrooms: 3, propertyType: 'Terraced', location: [-0.1076, 51.5274], isArticle4: false, isTiredLandlord: true, timeOnMarket: 75 }
    ];

    const filteredMock = isDistressed ? mockData.filter(p => p.isTiredLandlord) : mockData;

    const geoJson = {
      type: 'FeatureCollection',
      features: filteredMock.map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: p.location },
        properties: { ...p, planningIndicators: [] }
      }))
    };

    return NextResponse.json(geoJson);
  }
}
