import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

    // Store state in a short-lived cookie so the callback can verify it (CSRF protection).
    // State validation against this cookie is completed in GDX-003.
    const cookieStore = cookies();
    cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    });

    return NextResponse.redirect(authUrl);
}
