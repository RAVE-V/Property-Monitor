import { NextResponse, NextRequest } from 'next/server';
import { db } from '../../../../../libs/database/db';
import { leads, properties } from '../../../../../libs/database/schema';
import { eq, sql } from 'drizzle-orm';
import { sendStannpLetter } from '../../../../../libs/dtv/stannp';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const leadId = params.id;

        // Fetch lead and associated property
        const leadResult = await db.select({
            lead: leads,
            property: properties
        })
            .from(leads)
            .innerJoin(properties, eq(leads.propertyId, properties.id))
            .where(eq(leads.id, leadId))
            .limit(1);

        if (!leadResult || leadResult.length === 0 || !leadResult[0]) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const { property } = leadResult[0];

        // Mock extraction of address from geocoded data or placeholder for missing data.
        const mockAddress = {
            title: 'The',
            firstname: 'Homeowner',
            lastname: '',
            address1: `Property ${property.id.substring(0, 5)}`,
            city: 'London', // Default fallback
            postcode: 'SW1A 1AA',
            country: 'UK'
        };

        // Dispatch the letter via Stannp Utility
        const response = await sendStannpLetter({
            recipient: mockAddress,
            templateId: 'template_tired_landlord_v1',
            mergeVariables: {
                property_title: property.title,
                property_price: `£${property.price}`
            }
        });

        // We can also update the lead status to "Contacted" automatically
        // and increment outreach tracking metrics
        await db.update(leads)
            .set({ 
                status: 'Contacted', 
                outreachCount: sql`${leads.outreachCount} + 1`,
                lastOutreachAt: new Date(),
                updatedAt: new Date() 
            })
            .where(eq(leads.id, leadId));

        return NextResponse.json({ success: true, stannp: response, updatedStatus: 'Contacted' });
    } catch (error: any) {
        console.error('Letter generation failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
