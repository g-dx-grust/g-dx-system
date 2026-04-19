import { NextRequest, NextResponse } from 'next/server';
import { bootstrapUser } from '@/modules/auth/application/bootstrap-user';
import { getSessionCookieConfigs } from '@/shared/server/session';
import { isStrictLocalDevelopmentRequest } from '@/shared/server/request-guards';

export async function GET(req: NextRequest) {
    const base = req.nextUrl.origin;

    if (!isStrictLocalDevelopmentRequest(req)) {
        return NextResponse.redirect(new URL('/login', base));
    }

    let bootstrapResult: Awaited<ReturnType<typeof bootstrapUser>>;

    try {
        bootstrapResult = await bootstrapUser({
            openId: 'ou_local_operator',
            name: 'Local Operator',
            email: 'local-operator@example.com',
        });
    } catch (err) {
        console.error('[local-login] bootstrapUser failed:', err);
        return NextResponse.redirect(new URL('/login?error=local_login_failed', base));
    }

    const response = NextResponse.redirect(new URL('/dashboard/deals', base));
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

    return response;
}
