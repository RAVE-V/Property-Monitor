/**
 * check-db-coords.ts - Verify property coordinates are spread across cities
 */
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query(`
  SELECT source, 
         ROUND(ST_Y(location::geometry)::numeric, 4) as lat, 
         ROUND(ST_X(location::geometry)::numeric, 4) as lng, 
         LEFT(title, 50) as title
  FROM properties 
  WHERE source != 'rightmove'
  ORDER BY source, lat DESC 
  LIMIT 15
`);
r.rows.forEach((row: any) => console.log(row.source.padEnd(12), row.lat, row.lng, row.title));
const countR = await pool.query('SELECT COUNT(*) as c FROM demand_points');
console.log('\nDemand points in DB:', countR.rows[0].c);

// Test the occupancy query for London coordinates
const occ = await pool.query(`
  SELECT occupancy, ROUND(ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(-0.1276, 51.5074), 4326)::geography)/1000.0, 1) as dist_km
  FROM demand_points
  WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(-0.1276, 51.5074), 4326)::geography, 5000)
  ORDER BY dist_km
`);
console.log('\nDemand points near (-0.1276, 51.5074):', occ.rows.length, 'found');
occ.rows.forEach((r: any) => console.log('  occupancy:', r.occupancy, '% at', r.dist_km, 'km'));

await pool.end();
process.exit(0);
