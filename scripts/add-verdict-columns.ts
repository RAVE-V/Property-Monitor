import { db } from '../src/libs/database/db.js';
import { sql } from 'drizzle-orm';

async function run() {
    console.log('Adding AI verdict columns...');
    try {
        await db.execute(sql`ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "ai_verdict" text;`);
        await db.execute(sql`ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "ai_verdict_updated_at" timestamp;`);
        console.log('✅ Done!');
    } catch (e) {
        console.error('❌ Failed:', e);
    }
    process.exit(0);
}

run();
