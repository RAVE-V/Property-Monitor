import { NextResponse, NextRequest } from 'next/server';
import { db } from '../../../libs/database/db';
import { demandPoints } from '../../../libs/database/schema';
import { sql, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const bboxStr = searchParams.get('bbox');

    try {
        let rows;

        if (bboxStr) {
            const [minLng, minLat, maxLng, maxLat] = bboxStr.split(',').map(Number);
            rows = await db.select().from(demandPoints).where(
                and(
                    sql`ST_Within(${demandPoints.location}, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))`,
                    gte(demandPoints.occupancy, 50)
                )
            );
        } else {
            rows = await db.select().from(demandPoints).where(
                gte(demandPoints.occupancy, 50)
            );
        }

        const geoJson = {
            type: 'FeatureCollection',
            features: rows.map(p => {
                const loc = p.location as any;
                const coords = Array.isArray(loc) ? loc : loc?.coordinates || [-0.1276, 51.5074];
                return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: coords },
                    properties: {
                        id: p.id,
                        occupancy: p.occupancy,
                        source: p.source,
                        // Weight for heatmap intensity (0-1 scale)
                        intensity: (p.occupancy ?? 50) / 100,
                    }
                };
            })
        };

        return NextResponse.json(geoJson);
    } catch (error: any) {
        console.error('Hotspots API error:', error.message);
        // Return empty on error (map won't break)
        return NextResponse.json({ type: 'FeatureCollection', features: [] });
    }
}
