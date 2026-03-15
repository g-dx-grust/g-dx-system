import { NextResponse } from 'next/server';
import { assertLarkAuthConfigured, getLarkAuthUrl, OAUTH_STATE_COOKIE_NAME, OAUTH_STATE_MAX_AGE_SECONDS } from '@/server/auth/lark';
import { errorResponse } from '@/shared/server/http';

export async function GET() {
    try {
        assertLarkAuthConfigured();
    } catch (err) {
        console.error('[GDX Auth] Lark OAuth is not configured:', err);
        return errorResponse(500, 'INTERNAL_SERVER_ERROR', 'Auth provider is not configured.');
    }

    const state = crypto.randomUUID();
    const authUrl = getLarkAuthUrl(state);

    // Set state cookie directly on the redirect response.
    // cookies().set() does not apply to a separately created NextResponse,
    // so we must use response.cookies.set() to ensure the Set-Cookie header
    // is included in the redirect response.
    const response = NextResponse.redirect(authUrl);
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    });

    return response;
}
