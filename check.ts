import 'dotenv/config';
import { db } from './src/libs/database/db';
import { sql } from 'drizzle-orm';

async function checkTenures() {
    const counts = await db.execute(sql`SELECT tenure, COUNT(*) FROM properties GROUP BY tenure`);
    console.log('Tenure Distribution:', counts.rows);

    process.exit(0);
}
checkTenures();
