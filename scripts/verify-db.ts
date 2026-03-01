import { db } from '../src/libs/database/db.js';
import { sql } from 'drizzle-orm';

async function run() {
    const r = await db.execute(sql`SELECT COUNT(*) as count FROM demand_points`);
    console.log('Total demand points:', (r.rows[0] as any).count);
    process.exit(0);
}

run();
