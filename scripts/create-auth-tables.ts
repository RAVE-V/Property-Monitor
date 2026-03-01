import { db } from '../src/libs/database/db.js';
import { sql } from 'drizzle-orm';

async function run() {
    console.log('Creating auth tables...');

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "users" (
            "id" text PRIMARY KEY NOT NULL,
            "name" text,
            "email" text NOT NULL,
            "email_verified" timestamp,
            "image" text,
            CONSTRAINT "users_email_unique" UNIQUE("email")
        )
    `);
    console.log('✅ users');

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "accounts" (
            "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
            "type" text NOT NULL,
            "provider" text NOT NULL,
            "provider_account_id" text NOT NULL,
            "refresh_token" text,
            "access_token" text,
            "expires_at" integer,
            "token_type" text,
            "scope" text,
            "id_token" text,
            "session_state" text,
            PRIMARY KEY ("provider", "provider_account_id")
        )
    `);
    console.log('✅ accounts');

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "sessions" (
            "session_token" text PRIMARY KEY NOT NULL,
            "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
            "expires" timestamp NOT NULL
        )
    `);
    console.log('✅ sessions');

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "verification_tokens" (
            "identifier" text NOT NULL,
            "token" text NOT NULL,
            "expires" timestamp NOT NULL,
            PRIMARY KEY ("identifier", "token")
        )
    `);
    console.log('✅ verification_tokens');

    console.log('\n✅ All auth tables created successfully!');
    process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
