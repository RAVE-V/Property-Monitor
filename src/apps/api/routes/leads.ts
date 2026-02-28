import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../libs/database/db';
import { leads } from '../../../libs/database/schema';
import { eq } from 'drizzle-orm';

export async function leadRoutes(fastify: FastifyInstance) {

    fastify.get('/leads', async (request, reply) => {
        const results = await db.select().from(leads);
        return results;
    });

    fastify.post('/leads', async (request, reply) => {
        const bodySchema = z.object({
            propertyId: z.string().uuid(),
            status: z.enum(['New', 'Interested', 'Contacted', 'Viewing', 'Offered']).default('New'),
            notes: z.string().optional(),
            assumptionsOverride: z.any().optional(),
        });

        const parsed = bodySchema.parse(request.body);

        const newLead = await db.insert(leads).values({
            propertyId: parsed.propertyId,
            status: parsed.status,
            notes: parsed.notes || null,
            assumptionsOverride: parsed.assumptionsOverride || null,
        }).returning();

        return newLead[0];
    });

    fastify.patch('/leads/:id', async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid()
        });

        const bodySchema = z.object({
            status: z.enum(['New', 'Interested', 'Contacted', 'Viewing', 'Offered']).optional(),
            notes: z.string().optional(),
            assumptionsOverride: z.any().optional(),
        });

        const { id } = paramsSchema.parse(request.params);
        const parsed = bodySchema.parse(request.body);

        // Clean up undefined values for drizzle compatibility
        const updateData: any = { updatedAt: new Date() };
        if (parsed.status !== undefined) updateData.status = parsed.status;
        if (parsed.notes !== undefined) updateData.notes = parsed.notes;
        if (parsed.assumptionsOverride !== undefined) updateData.assumptionsOverride = parsed.assumptionsOverride;

        const updated = await db.update(leads)
            .set(updateData)
            .where(eq(leads.id, id))
            .returning();

        if (updated.length === 0) {
            reply.status(404).send({ error: "Lead not found" });
            return;
        }

        return updated[0];
    });
}
