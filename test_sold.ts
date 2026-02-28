import 'dotenv/config';
import { db } from './src/libs/database/db';
import { leads, properties } from './src/libs/database/schema';
import { eq } from 'drizzle-orm';

async function seedSoldLead() {
    const p = await db.query.properties.findFirst({
        where: eq(properties.portalId, 'rightmove-fake-2')
    });

    if (p) {
        await db.insert(leads).values({
            propertyId: p.id,
            status: 'Pursuing', // Mocking an older lead
            notes: 'Testing sold auto-routing'
        }).onConflictDoNothing();
        console.log('Seeded pipeline lead for sold property:', p.title);
    } else {
        console.log('Property not found');
    }
}

seedSoldLead().then(() => process.exit(0));
