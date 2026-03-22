import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/api/auth/login', '/api/auth/logout'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow static assets
    if (
        pathname.startsWith('/_next') ||
        pathname.includes('.') // static files (favicon, images, etc.)
    ) {
        return NextResponse.next();
    }

    // Allow public routes
    if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
        return NextResponse.next();
    }

    // Check for HttpOnly auth cookie
    const authCookie = request.cookies.get('hubview_auth');

    let verifiedUserId: string | null = null;
    if (authCookie?.value) {
        const { verifyJWT } = await import('@/lib/jwt');
        verifiedUserId = await verifyJWT(authCookie.value);
    }

    if (!verifiedUserId) {
        // API routes: return 401
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        // Page routes: redirect to login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Inject userId into request headers for API routes
    if (pathname.startsWith('/api/')) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', verifiedUserId as string);
        return NextResponse.next({
            request: { headers: requestHeaders },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (logo, images etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
    ],
};
