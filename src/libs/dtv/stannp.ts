/**
 * Utility for Direct-To-Vendor (DTV) postal outreach via Stannp.
 * https://www.stannp.com/
 */

export interface LetterPayload {
    recipient: {
        title: string;
        firstname: string;
        lastname: string;
        address1: string;
        address2?: string;
        city: string;
        postcode: string;
        country: string;
    };
    templateId: string;
    mergeVariables?: Record<string, string>;
}

export async function sendStannpLetter(payload: LetterPayload) {
    const apiKey = process.env.STANNP_API_KEY;

    if (!apiKey) {
        console.warn('[Stannp] No API key found. Simulating letter dispatch.');
        console.log(`[Stannp] Dispatching letter to ${payload.recipient.address1}, ${payload.recipient.city}`);
        return { success: true, mock: true, id: `mock-letter-${Date.now()}` };
    }

    // Real implementation for production
    console.log('[Stannp] Dispatching real letter to Stannp API...');

    const response = await fetch('https://dash.stannp.com/api/v1/letters/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey
        },
        body: JSON.stringify({
            recipient: payload.recipient,
            template: payload.templateId,
            mergeVariables: payload.mergeVariables || {},
            test: true // Default to test mode
        })
    });

    if (!response.ok) {
        throw new Error(`Stannp API completely failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}
