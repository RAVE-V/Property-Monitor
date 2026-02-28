// seed.ts — Run: npx tsx seed.ts
import { scrapeRightmove } from './src/workers/scrapers/rightmove.js';
import { db } from './src/libs/database/db.js';

async function seed() {
    console.log('🚀 Seeding database with scraped property data...');
    try {
        await scrapeRightmove('london');
        await scrapeRightmove('manchester');
        console.log('✅ Seeding complete. Checking row count...');
        const { sql: sqlTag } = await import('drizzle-orm');
        const result = await db.execute(sqlTag`SELECT COUNT(*) as count FROM properties`);
        console.log('Properties in DB:', result.rows[0]);
    } catch (err) {
        console.error('❌ Seed failed:', err);
    } finally {
        process.exit(0);
    }
}

seed();
