import { db } from '../src/libs/database/db.js';
import { sql } from 'drizzle-orm';

async function run() {
    await db.execute(sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS description text`);
    console.log('✅ description column added');
    process.exit(0);
}
run();
