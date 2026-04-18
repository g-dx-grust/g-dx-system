import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { assertLarkAuthConfigured, OAUTH_STATE_COOKIE_NAME } from '@/server/auth/lark';
import { appConfig } from '@g-dx/config';
import { bootstrapUser } from '@/modules/auth/application/bootstrap-user';
import { getSessionCookieConfigs } from '@/shared/server/session';

// ─── Lark API response types ─────────────────────────────────────────────────
// Lark authen/v2/oauth/token returns token fields at the ROOT level (no nested `data`)
// Docs: https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/authentication-management/access-token/get-user-access-token

interface LarkV2TokenResponse {
    code: number;
    msg?: string;
    // Token fields are at root level for v2 API (NOT inside `data`)
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    refresh_token?: string;
    refresh_expires_in?: number;
    scope?: string;
}

interface LarkUserInfoResponse {
    code: number;
    msg?: string;
    data?: {
        open_id: string;
        union_id?: string;
        name?: string;
        en_name?: string;
        email?: string;
        enterprise_email?: string;
        avatar_url?: string;
        avatar_thumb?: string;
        avatar_middle?: string;
        avatar_big?: string;
        mobile?: string;
        employee_no?: string;
    };
}

async function exchangeCodeForToken(code: string): Promise<LarkV2TokenResponse> {
    const res = await fetch('https://open.larksuite.com/open-apis/authen/v2/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: appConfig.auth.larkClientId,
            client_secret: appConfig.auth.larkClientSecret,
            code,
            redirect_uri: appConfig.auth.larkRedirectUri,
        }),
    });
    const json = await res.json() as LarkV2TokenResponse;
    console.log('[GDX Auth] Token exchange response code:', json.code, '| has access_token:', !!json.access_token);
    return json;
}

async function fetchLarkUserInfo(accessToken: string): Promise<LarkUserInfoResponse> {
    const res = await fetch('https://open.larksuite.com/open-apis/authen/v1/user_info', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    const json = await res.json() as LarkUserInfoResponse;
    console.log('[GDX Auth] User info response code:', json.code, '| has open_id:', !!json.data?.open_id);
    return json;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const baseUrl = appConfig.app.url;

    try {
        assertLarkAuthConfigured();
    } catch (err) {
        console.error('[GDX Auth] Lark OAuth not configured:', err);
        return NextResponse.redirect(`${baseUrl}/login?error=auth_not_configured`);
    }

    const { searchParams } = req.nextUrl;

    const providerError = searchParams.get('error');
    if (providerError) {
        console.warn('[GDX Auth] Provider returned error:', providerError);
        return NextResponse.redirect(`${baseUrl}/login?error=lark_auth_denied`);
    }

    const code = searchParams.get('code');
    if (!code) {
        return NextResponse.redirect(`${baseUrl}/login?error=missing_code`);
    }

    const state = searchParams.get('state');
    const cookieStore = cookies();
    const expectedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;

    if (!state || !expectedState || state !== expectedState) {
        console.warn('[GDX Auth] State mismatch. received:', state?.slice(0, 8), 'expected:', expectedState?.slice(0, 8));
        return NextResponse.redirect(`${baseUrl}/login?error=state_mismatch`);
    }
    // OAuth state cookie is cleared on the redirect response at the end of this handler.

    // ─── Token exchange ───────────────────────────────────────────────────────
    let tokenData: LarkV2TokenResponse;
    try {
        tokenData = await exchangeCodeForToken(code);
    } catch (err) {
        console.error('[GDX Auth] Token exchange network error:', err);
        return NextResponse.redirect(`${baseUrl}/login?error=token_exchange_failed`);
    }

    // v2 API: access_token is at ROOT level (not nested in data)
    if (tokenData.code !== 0 || !tokenData.access_token) {
        console.error('[GDX Auth] Token exchange failed. code:', tokenData.code, 'msg:', tokenData.msg);
        return NextResponse.redirect(`${baseUrl}/login?error=token_exchange_failed`);
    }

    const accessToken = tokenData.access_token;

    // ─── Fetch user info ──────────────────────────────────────────────────────
    let userInfo: LarkUserInfoResponse;
    try {
        userInfo = await fetchLarkUserInfo(accessToken);
    } catch (err) {
        console.error('[GDX Auth] User info network error:', err);
        return NextResponse.redirect(`${baseUrl}/login?error=userinfo_failed`);
    }

    if (userInfo.code !== 0 || !userInfo.data?.open_id) {
        console.error('[GDX Auth] User info failed. code:', userInfo.code, 'msg:', userInfo.msg);
        return NextResponse.redirect(`${baseUrl}/login?error=userinfo_failed`);
    }

    const larkUser = userInfo.data;
    const displayName = larkUser.name || larkUser.en_name || 'Lark User';
    const email = larkUser.enterprise_email || larkUser.email || '';
    const avatarUrl = larkUser.avatar_big || larkUser.avatar_middle || larkUser.avatar_thumb || larkUser.avatar_url || null;

    console.log('[GDX Auth] Bootstrapping user:', larkUser.open_id, '|', displayName);

    // ─── Bootstrap user & issue session ──────────────────────────────────────
    let bootstrapResult: Awaited<ReturnType<typeof bootstrapUser>>;
    try {
        bootstrapResult = await bootstrapUser({
            openId: larkUser.open_id,
            name: displayName,
            email,
            avatarUrl,
        });
    } catch (err) {
        console.error('[GDX Auth] Bootstrap failed:', err);
        return NextResponse.redirect(`${baseUrl}/login?error=bootstrap_failed`);
    }

    console.log('[GDX Auth] Login success → /dashboard/deals');

    // cookies().set() does not apply to a separately created NextResponse,
    // so we must set session cookies directly on the redirect response.
    const response = NextResponse.redirect(`${baseUrl}/dashboard/deals`);
    const sessionCookies = getSessionCookieConfigs(
        bootstrapResult.user.id,
        bootstrapResult.activeBusinessScope,
    );
    for (const cookie of sessionCookies) {
        response.cookies.set(cookie.name, cookie.value, {
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
            secure: cookie.secure,
            path: cookie.path,
            maxAge: cookie.maxAge,
        });
    }
    // Clear the OAuth state cookie
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);

    return response;
}
