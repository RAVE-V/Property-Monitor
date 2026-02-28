import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`);
console.log('✅ status column added (or already exists)');
await pool.end();
process.exit(0);
