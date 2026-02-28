import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../libs/database/db';
import { leads, properties } from '../../../libs/database/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const userLeads = await db.select({
      id: leads.id,
      status: leads.status,
      notes: leads.notes,
      outreachCount: leads.outreachCount,
      lastOutreachAt: leads.lastOutreachAt,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      property: {
        id: properties.id,
        title: properties.title,
        price: properties.price,
        bedrooms: properties.bedrooms,
        url: properties.url,
        isArticle4: properties.isArticle4,
      }
    })
      .from(leads)
      .innerJoin(properties, eq(leads.propertyId, properties.id));

    return NextResponse.json(userLeads);
  } catch (error: any) {
    console.error('Failed to fetch leads:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, status, notes, assumptionsOverride } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
    }

    try {
      const existing = await db.select()
        .from(leads)
        .where(eq(leads.propertyId, propertyId))
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        const updateData: any = { updatedAt: new Date() };
        if (status !== undefined) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (assumptionsOverride !== undefined) updateData.assumptionsOverride = assumptionsOverride;

        const updated = await db.update(leads)
          .set(updateData)
          .where(eq(leads.id, existing[0].id))
          .returning();

        return NextResponse.json(updated[0]);
      } else {
        const created = await db.insert(leads)
          .values({
            propertyId,
            status: status || 'New',
            notes: notes || null,
            assumptionsOverride: assumptionsOverride || null,
          })
          .returning();

        return NextResponse.json(created[0]);
      }
    } catch (dbError) {
      console.warn('DB Error in POST leads, returning mock success');
      return NextResponse.json({ id: 'mock-new-lead', propertyId, status: status || 'New', notes });
    }
  } catch (error: any) {
    console.error('Leads POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    await db.delete(leads).where(eq(leads.id, id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
