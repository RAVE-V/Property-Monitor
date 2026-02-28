import { NextResponse, NextRequest } from 'next/server';
import { db } from '../../../libs/database/db';
import { article4Zones } from '../../../libs/database/schema';
import { sql, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bboxStr = searchParams.get('bbox');

  let conditions = [];

  if (bboxStr) {
    const [minLng, minLat, maxLng, maxLat] = bboxStr.split(',').map(Number);
    conditions.push(sql`ST_Intersects(${article4Zones.boundary}, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))`);
  }

  try {
    const data = await db.select().from(article4Zones).where(and(...conditions));

    const geoJson = {
      type: 'FeatureCollection',
      features: data.map(z => ({
        type: 'Feature',
        geometry: z.boundary, // PostGIS geometry
        properties: {
          id: z.id,
          name: z.name,
          councilId: z.councilId,
          zoneType: z.zoneType
        }
      }))
    };

    return NextResponse.json(geoJson);
  } catch (error: any) {
    console.warn('Database connection failed, using static mock zones for testing.');
    
    // Mock C5 and Article 4 zones
    const mockZones = [
      {
        id: 'mock-zone-1',
        name: 'Westminster STL Restriction Zone',
        zoneType: 'C5',
        boundary: {
          type: 'Polygon',
          coordinates: [[[-0.165, 51.520], [-0.115, 51.520], [-0.115, 51.485], [-0.165, 51.485], [-0.165, 51.520]]]
        }
      },
      {
        id: 'mock-zone-2',
        name: 'Kensington HMO Article 4',
        zoneType: 'HMO',
        boundary: {
          type: 'Polygon',
          coordinates: [[[-0.215, 51.510], [-0.185, 51.510], [-0.185, 51.490], [-0.215, 51.490], [-0.215, 51.510]]]
        }
      }
    ];

    const geoJson = {
      type: 'FeatureCollection',
      features: mockZones.map(z => ({
        type: 'Feature',
        geometry: z.boundary,
        properties: { ...z, boundary: undefined }
      }))
    };

    return NextResponse.json(geoJson);
  }
}
