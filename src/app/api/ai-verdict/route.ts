import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../libs/database/db';
import { properties } from '../../../libs/database/schema';
import { eq } from 'drizzle-orm';

// Simple in-memory cache to avoid repeated LLM calls for same property (fast-path)
const verdictCache = new Map<string, string>();

/**
 * Validate that a listing URL is safe and points to a known property portal.
 * This prevents arbitrary SSRF to internal or unexpected external services.
 */
function isAllowedListingUrl(urlStr: string): boolean {
    try {
        const parsed = new URL(urlStr);

        // Only allow HTTP(S) schemes
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false;
        }

        // Allow-list of known listing portals
        const allowedHosts = new Set<string>([
            'www.openrent.co.uk',
            'openrent.co.uk',
            'www.spareroom.co.uk',
            'spareroom.co.uk',
            'www.onthemarket.com',
            'onthemarket.com',
        ]);

        return allowedHosts.has(parsed.hostname.toLowerCase());
    } catch {
        // Invalid URL
        return false;
    }
}

/**
 * Fetch the full listing description from the portal URL.
 * Works for OpenRent, SpareRoom, and OnTheMarket.
 * Returns a trimmed description string or null.
 */
async function fetchDescription(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return null;
        const html = await res.text();

        // OpenRent: description inside <div class="description"> or property-description
        let match = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (!match) {
            // SpareRoom: look for listing body / advert text
            match = html.match(/<div[^>]*class="[^"]*(?:listing-body|advert_description|listing_content|property-description)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        }
        if (!match) {
            // Generic: look for meta description as fallback
            const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
            if (metaMatch) return metaMatch[1]!.trim().slice(0, 2000);
        }

        if (match) {
            // Strip HTML tags, decode entities, trim
            const text = match[1]!
                .replace(/<[^>]+>/g, ' ')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&nbsp;/g, ' ')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/\s+/g, ' ')
                .trim();
            return text.slice(0, 2000); // Cap at 2000 chars to keep prompt focused
        }
        return null;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            id, title, price, bedrooms, propertyType, source, url,
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
                    verdictCache.set(id, existing[0].aiVerdict);
                    return NextResponse.json({ verdict: existing[0].aiVerdict });
                }
            } catch (dbErr) {
                console.error('Database read error in AI verdict:', dbErr);
            }
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ verdict: null, error: 'No GROQ_API_KEY set' }, { status: 500 });
        }

        // Fetch the full listing description from the portal URL
        let description: string | null = null;
        if (url && isAllowedListingUrl(url)) {
            description = await fetchDescription(url);
            // Persist description to DB for future use
            if (description && id) {
                try {
                    await db.update(properties)
                        .set({ description })
                        .where(eq(properties.id, id));
                } catch { /* non-critical */ }
            }
        }

        const systemPrompt = `You are a senior UK property investment analyst specialising in Serviced Accommodation (SA), Rent-to-Rent (R2R), and HMO strategies.

You analyse listings to determine if a property is suitable for short-term letting or subletting. You will be given the listing ad description plus financial metrics.

## YOUR ANALYSIS MUST COVER (in this order):

1. **COMPANY LET STATUS** — Read the description carefully. Does it explicitly allow "company lets", "corporate lets", or "professionals"? Does it mention "no subletting", "no Airbnb", or "no short-term lets"? If the ad says the landlord accepts company lets, this is extremely positive for R2R. Flag this clearly.

2. **FINANCIAL VIABILITY** — Based on the rent, estimated SA income, and projected profit, is this deal worth pursuing? What is the realistic monthly profit after all costs? Is the ROI above the 15% threshold that makes R2R viable?

3. **DEMAND & LOCATION** — Given the local Airbnb occupancy data, is there enough short-term rental demand to sustain SA income? Consider the area's tourism, corporate travel, and event demand.

4. **RED FLAGS** — Check for: Article 4 restrictions, lease restrictions on subletting, unrealistically low price (scam risk), or any terms in the description that would block SA/R2R use.

5. **NEGOTIATION ANGLE** — If the landlord is motivated (tired landlord, price drops, long time on market), suggest a negotiation strategy. If not, note whether the price is fair.

## OUTPUT FORMAT:
Give your verdict in exactly this format (use the emoji labels):

🏢 Company Let: [YES/NO/UNCLEAR — with brief evidence from description]
💰 Deal Rating: [STRONG/MODERATE/WEAK — with 1-line reason]
📍 Demand: [HIGH/MEDIUM/LOW — based on occupancy data]
⚠️ Red Flags: [Any issues, or "None detected"]
🎯 Verdict: [1-2 sentence final recommendation]

Be specific and reference actual text from the listing. Never be generic.`;

        const userPrompt = `Analyse this UK rental property listing:

## PROPERTY DATA
Title: ${title || 'Unknown'}
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

## FULL LISTING DESCRIPTION
${description || '[Description not available — analyse based on financial data only]'}

Give your structured expert verdict now:`;

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
                max_tokens: 350,
                temperature: 0.4,
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
