import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'gdx_session';
const PROTECTED_PREFIXES = ['/dashboard', '/customers', '/sales', '/calls', '/settings'];
const AUTH_PREFIXES = ['/login', '/auth/callback', '/auth/local-login'];

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

    if (matchesPrefix(pathname, AUTH_PREFIXES) && hasSession) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/customers/:path*', '/sales/:path*', '/calls/:path*', '/settings/:path*', '/login', '/auth/callback', '/auth/local-login'],
};
