import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'gdx_session';
const PROTECTED_PREFIXES = ['/admin', '/dashboard', '/customers', '/sales', '/calls', '/settings', '/jet', '/office'];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

    if (matchesPrefix(pathname, PROTECTED_PREFIXES) && !hasSession) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/dashboard/:path*', '/customers/:path*', '/sales/:path*', '/calls/:path*', '/settings/:path*', '/jet/:path*', '/office/:path*', '/login', '/auth/callback', '/auth/local-login'],
};
