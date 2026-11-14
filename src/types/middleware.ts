import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from "better-auth/cookies";

// Define your protected and public auth routes clearly
const PROTECTED_ROUTES_PREFIXES = ['/dashboard', '/dashboard/profile', '/dashboard/settings', '/dashboard/loans', '/dashboard/cards', '/admin', '/admin/users', '/admin/transactions', '/admin/loans'];
const AUTH_ROUTES_PREFIXES = ['/auth/login', '/auth/register'];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl; // Destructure for cleaner access
    const session = getSessionCookie(req);

    // --- Optimization 1: Use direct string checks for known paths ---
    // Instead of 'startsWith' on every protected route in `some()`,
    // we can leverage the `matcher` config to know if we're *potentially* on a protected route.
    // However, the `matcher` itself is for Next.js to decide *when to run this middleware*.
    // Inside the middleware, we still need to check the specific path.

    // Check if the current path is an authentication route
    const isAuthRoute = AUTH_ROUTES_PREFIXES.some(route =>
        pathname.startsWith(route)
    );

    // Check if the current path is a protected route
    // Using `some()` with `startsWith` is already quite efficient for small arrays.
    // For a very large number of protected routes, you might consider a Set lookup,
    // but for 3-5 routes, this is perfectly fine.
    const isProtectedRoute = PROTECTED_ROUTES_PREFIXES.some(route =>
        pathname.startsWith(route)
    );

    // --- Scenario 1: Logged-in user trying to access auth pages ---
    if (isAuthRoute && session) {
        // If the user is already logged in, redirect them to the dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // --- Scenario 2: Unauthenticated user trying to access protected pages ---
    if (isProtectedRoute && !session) {
        const loginUrl = new URL('/auth/login', req.url);

        // Add a 'redirect' query parameter to send the user back after successful login
        loginUrl.searchParams.set('redirect', encodeURIComponent(pathname));

        return NextResponse.redirect(loginUrl);
    }

    // --- Default: Allow the request to proceed ---
    // If none of the above conditions are met, let the request continue
    return NextResponse.next();
}


// !IMPORTANT: Define a matcher to run middleware only on specific paths
// This improves performance by not running middleware on all requests
export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*'],
};