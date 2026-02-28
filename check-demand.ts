import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const r1 = await pool.query('SELECT COUNT(*) as c FROM demand_points');
console.log('demand_points count:', r1.rows[0].c);

const r2 = await pool.query('SELECT occupancy, ST_AsText(location) as loc, ST_SRID(location) as srid FROM demand_points LIMIT 5');
r2.rows.forEach((r: any) => console.log('occupancy:', r.occupancy, '| loc:', r.loc, '| srid:', r.srid));

const r3 = await pool.query(`SELECT COUNT(*) as c FROM demand_points WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(-0.1276, 51.5074), 4326)::geography, 5000)`);
console.log('near london:', r3.rows[0].c);

await pool.end();
process.exit(0);
