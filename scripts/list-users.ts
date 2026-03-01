import { db } from '../src/libs/database/db.js';
import { users, accounts } from '../src/libs/database/schema.js';
import { eq } from 'drizzle-orm';

async function listUsers() {
    console.log('\n👥 Property Monitor User Report\n');

    try {
        const query = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            provider: accounts.provider,
            lastVerified: users.emailVerified,
        })
            .from(users)
            .leftJoin(accounts, eq(users.id, accounts.userId));

        console.log(`Total Users: ${query.length}\n`);

        if (query.length > 0) {
            console.table(query.map(u => ({
                Name: u.name || 'N/A',
                Email: u.email,
                Provider: u.provider || 'N/A',
                Verified: u.lastVerified ? u.lastVerified.toISOString().split('T')[0] : 'N/A'
            })));
        } else {
            console.log('No users found in the database.');
        }

    } catch (error) {
        console.error('Failed to list users:', error);
    }

    process.exit(0);
}

listUsers();
