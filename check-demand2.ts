import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const r = await pool.query(`
  SELECT COUNT(*) as cnt,
         MIN(ST_Y(location)) as min_lat,
         MAX(ST_Y(location)) as max_lat,
         MIN(ST_X(location)) as min_lng,
         MAX(ST_X(location)) as max_lng
  FROM demand_points
`);
console.log('demand_points:', JSON.stringify(r.rows[0]));

// Show first few rows
const r2 = await pool.query(`SELECT occupancy, ST_Y(location) as lat, ST_X(location) as lng FROM demand_points LIMIT 5`);
r2.rows.forEach((row: any) => console.log('  occupancy:', row.occupancy, 'at', Number(row.lat).toFixed(4), Number(row.lng).toFixed(4)));

// Test distance query manually
const r3 = await pool.query(`
  SELECT COUNT(*) as cnt 
  FROM demand_points 
  WHERE ABS(ST_Y(location) - 51.5126) < 0.1 AND ABS(ST_X(location) - (-0.1329)) < 0.1
`);
console.log('Near Soho (manual bbox):', r3.rows[0].cnt);

// Test exact query from route
const r4 = await pool.query(
    `SELECT occupancy, ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as dist
   FROM demand_points ORDER BY dist ASC LIMIT 5`,
    [-0.1276, 51.5074]
);
r4.rows.forEach((row: any) => console.log('  dist:', Number(row.dist).toFixed(5), 'occupancy:', row.occupancy));

await pool.end();
process.exit(0);
