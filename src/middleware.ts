import { auth } from './libs/auth';

// Use the native Auth.js edge-compatible middleware
// https://authjs.dev/getting-started/migrating-to-v5#edge-compatibility
export default auth((req) => {
    // If we want custom redirect logic, we can put it here inside the auth callback
    const { nextUrl } = req;
    const isAuthenticated = !!req.auth;

    // Allow auth routes, static files, and API auth routes through always
    const isAuthRoute = nextUrl.pathname.startsWith('/auth');
    const isAPIAuthRoute = nextUrl.pathname.startsWith('/api/auth');
    const isPublicFile = nextUrl.pathname.startsWith('/_next') ||
        nextUrl.pathname.startsWith('/favicon') ||
        nextUrl.pathname.includes('.');

    if (isPublicFile || isAPIAuthRoute) {
        return; // Proceed normally
    }

    // Redirect to sign-in if accessing a protected route without being authenticated
    if (!isAuthenticated && !isAuthRoute) {
        const redirectUrl = new URL('/auth/signin', nextUrl.origin);
        // Include the requested path as callbackUrl for post-login redirect
        redirectUrl.searchParams.set('callbackUrl', nextUrl.href);
        return Response.redirect(redirectUrl);
    }
});

// Define the paths where the middleware should run
export const config = {
    // Protect all routes except static assets
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
