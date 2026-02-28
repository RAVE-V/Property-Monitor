import { NextResponse, NextRequest } from 'next/server';
import { db } from '../../../libs/database/db';
import { sql } from 'drizzle-orm';

/**
 * GET /api/occupancy?lat=51.5&lng=-0.12
 * Returns nearest demand points within ~20km and average occupancy.
 * Powers "SA Demand Intelligence" section in the SidePanel.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ avgOccupancy: null, tier: 'Unknown', tierColour: '#6b7280', nearbyPoints: [] });
  }

  try {
    // Use degree-based distance: 0.18° ≈ 20km; avoids geography type cast issues
    const rows = await db.execute(sql`
      SELECT
        occupancy,
        source,
        ROUND(
          (SQRT(
            POWER(ST_Y(location) - ${lat}, 2) + POWER(ST_X(location) - ${lng}, 2)
          ) * 111.32)::numeric, 1
        ) AS distance_km
      FROM demand_points
      WHERE SQRT(
        POWER(ST_Y(location) - ${lat}, 2) + POWER(ST_X(location) - ${lng}, 2)
      ) < 0.18
      ORDER BY distance_km ASC
      LIMIT 5
    `);

    const points = rows.rows as any[];
    const avgOccupancy = points.length
      ? Math.round(points.reduce((s: number, r: any) => s + Number(r.occupancy), 0) / points.length)
      : null;

    let tier = 'Unknown';
    let tierColour = '#6b7280';
    if (avgOccupancy !== null) {
      if (avgOccupancy >= 80) { tier = 'Very High Demand'; tierColour = '#00f2ff'; }
      else if (avgOccupancy >= 65) { tier = 'High Demand'; tierColour = '#22c55e'; }
      else if (avgOccupancy >= 50) { tier = 'Moderate Demand'; tierColour = '#eab308'; }
      else { tier = 'Low Demand'; tierColour = '#ef4444'; }
    }

    return NextResponse.json({
      avgOccupancy,
      tier,
      tierColour,
      nearbyPoints: points.map((r: any) => ({
        occupancy: Number(r.occupancy),
        distanceKm: Number(r.distance_km),
        source: r.source,
      })),
    });
  } catch (error: any) {
    console.error('Occupancy API error:', error.message);
    return NextResponse.json({ avgOccupancy: null, tier: 'Unknown', tierColour: '#6b7280', nearbyPoints: [], _debug: error.message });
  }
}
