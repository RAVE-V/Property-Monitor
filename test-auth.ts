import { handlers } from './src/libs/auth.js';

async function testAuth() {
    console.log('Initializing manual NextAuth request...');
    const req = new Request('http://localhost:3000/api/auth/providers', {
        method: 'GET',
        headers: {
            'Host': 'localhost:3000',
        }
    });

    try {
        const res = await handlers.GET(req as any);
        console.log('Response Status:', res.status);
        console.log('Response Body:', await res.text());
    } catch (e) {
        console.error('NextAuth Internal Error:', e);
    }
}
testAuth();
