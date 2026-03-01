import { NextRequest, NextResponse } from 'next/server';
import { auth } from './libs/auth';

export async function proxy(req: NextRequest) {
    const session = await (auth as any)();

    const { pathname } = req.nextUrl;

    // Allow auth routes, static files, and API auth routes through always
    const isAuthRoute = pathname.startsWith('/auth');
    const isAPIAuthRoute = pathname.startsWith('/api/auth');
    const isPublicFile = pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.');

    if (isPublicFile || isAPIAuthRoute || isAuthRoute) {
        return NextResponse.next();
    }

    // Protect all other routes — redirect to sign-in with callback URL
    if (!session) {
        const redirectUrl = new URL('/auth/signin', req.nextUrl.origin);
        redirectUrl.searchParams.set('callbackUrl', req.nextUrl.href);
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
