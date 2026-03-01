import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../libs/database/db';
import { properties } from '../../../libs/database/schema';
import { eq } from 'drizzle-orm';

// Simple in-memory cache to avoid repeated LLM calls for same property (fast-path)
const verdictCache = new Map<string, string>();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            id, title, price, bedrooms, propertyType, source,
            monthlyProfit, income, occupancyRate, isArticle4,
            isTiredLandlord, priceDropPercent, timeOnMarket,
            roiPercentage, breakEvenADR
        } = body;

        // Layer 1: Check in-memory fast-path cache
        if (id && verdictCache.has(id)) {
            return NextResponse.json({ verdict: verdictCache.get(id) });
        }

        // Layer 2: Check persistent database cache
        if (id) {
            try {
                const existing = await db.select({
                    aiVerdict: properties.aiVerdict,
                    aiVerdictUpdatedAt: properties.aiVerdictUpdatedAt
                })
                    .from(properties)
                    .where(eq(properties.id, id))
                    .limit(1);

                if (existing[0]?.aiVerdict) {
                    // Cache in memory for next time
                    verdictCache.set(id, existing[0].aiVerdict);
                    return NextResponse.json({ verdict: existing[0].aiVerdict });
                }
            } catch (dbErr) {
                console.error('Database read error in AI verdict:', dbErr);
                // Continue to LLM call if DB fails
            }
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ verdict: null, error: 'No GROQ_API_KEY set' }, { status: 500 });
        }

        const systemPrompt = `You are a UK property investment analyst specialising in Serviced Accommodation (SA), Rent-to-Rent (R2R), and HMO strategies. You provide concise, actionable expert verdicts on rental properties.

Your verdict must be 2-3 sentences maximum. Be direct, use specific financial language, and focus on what a professional investor would care about. Never use generic filler phrases.

Think about:
- Is the profit margin viable for SA/R2R?
- Does local Airbnb demand support short-term let income?
- Are there planning, legal, or negotiation angles the investor should know?
- What is the optimal exit strategy for this specific asset?`;

        const userPrompt = `Analyse this UK rental property and give an expert investment verdict:

Property: ${title || 'Unknown'}
Type: ${propertyType || 'Unknown'} | Bedrooms: ${bedrooms ?? 'Unknown'} | Source: ${source}
Monthly Rent: £${price?.toLocaleString() ?? 'Unknown'}
Estimated SA Monthly Income: £${income?.toLocaleString() ?? 'Unknown'}
Projected Monthly Profit: £${monthlyProfit?.toLocaleString() ?? 'Unknown'}
ROI: ${roiPercentage ?? 'Unknown'}% | Break-even ADR: £${breakEvenADR ?? 'Unknown'}/night
Local Airbnb Occupancy: ${occupancyRate != null ? `${occupancyRate}%` : 'Unknown (no local data)'}
Article 4 Zone: ${isArticle4 ? 'YES — planning restrictions apply' : 'No'}
Motivated/Tired Landlord: ${isTiredLandlord ? 'YES' : 'No'}
Price Drop: ${priceDropPercent ? `${priceDropPercent}% reduction` : 'None'}
Time on Market: ${timeOnMarket > 0 ? `${timeOnMarket} days` : 'New listing'}

Give your expert verdict now:`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 200,
                temperature: 0.6,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Groq API error:', err);
            return NextResponse.json({ verdict: null, error: 'Groq API error' }, { status: 502 });
        }

        const data = await response.json() as any;
        const verdict = data.choices?.[0]?.message?.content?.trim() ?? null;

        // Cache it in Memory and Database
        if (id && verdict) {
            verdictCache.set(id, verdict);
            if (verdictCache.size > 500) {
                const firstKey = verdictCache.keys().next().value;
                if (firstKey) verdictCache.delete(firstKey);
            }

            // Persist to DB for all other users to benefit
            try {
                await db.update(properties)
                    .set({
                        aiVerdict: verdict,
                        aiVerdictUpdatedAt: new Date()
                    })
                    .where(eq(properties.id, id));
            } catch (e) {
                console.error('Failed to persist AI verdict to DB:', e);
            }
        }

        return NextResponse.json({ verdict });
    } catch (err) {
        console.error('AI verdict error:', err);
        return NextResponse.json({ verdict: null, error: 'Internal error' }, { status: 500 });
    }
}
