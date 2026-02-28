import 'dotenv/config';
import { db } from './src/libs/database/db.js';
import { properties } from './src/libs/database/schema.js';
import { sql } from 'drizzle-orm';

async function geocodePostcode(postcode: string) {
    try {
        const clean = postcode.replace(/\s+/g, '').toUpperCase();
        const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`);
        if (!res.ok) {
            const outRes = await fetch(`https://api.postcodes.io/outcodes/${clean}`);
            if (!outRes.ok) return null;
            const json = await outRes.json() as any;
            if (json.status === 200 && json.result) return { lat: json.result.latitude, lng: json.result.longitude };
            return null;
        }
        const json = await res.json() as any;
        if (json.status === 200 && json.result) return { lat: json.result.latitude, lng: json.result.longitude };
        return null;
    } catch { return null; }
}

async function fix() {
    const all = await db.select().from(properties);
    console.log(`Checking ${all.length} properties to fix fallback coordinates...`);
    let fixed = 0;

    // We only care about OpenRent right now since those defaulted 
    for (const p of all) {
        if (!p.title) continue;

        // Extract postcode from end of title string (e.g., "M1", "SW6")
        const pcMatch = p.title.match(/,\s*([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d?[A-Z]{0,2})\s*$/i);
        if (pcMatch) {
            const postcode = pcMatch[1]!.trim().toUpperCase();
            const geo = await geocodePostcode(postcode);
            if (geo) {
                // Update coordinate to real outcode/incode representation
                const locSql = sql`ST_SetSRID(ST_MakePoint(${geo.lng}, ${geo.lat}), 4326)` as any;
                await db.update(properties).set({ location: locSql, status: p.status }).where(sql`id = ${p.id}`);
                fixed++;
                console.log(`✓ Relocated "${p.title}" to ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}`);
            }
        }
    }

    console.log(`\n✅ Done! Fixed ${fixed} properties.`);
    process.exit(0);
}

fix();
