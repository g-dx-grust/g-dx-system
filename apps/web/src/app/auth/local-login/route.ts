import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@g-dx/config';
import { bootstrapUser } from '@/modules/auth/application/bootstrap-user';

export async function GET(req: NextRequest) {
    const base = req.nextUrl.origin;

    if (appConfig.app.env !== 'local') {
        return NextResponse.redirect(new URL('/login', base));
    }

    try {
        await bootstrapUser({
            openId: 'ou_local_operator',
            name: 'Local Operator',
            email: 'local-operator@example.com',
        });
    } catch (err) {
        console.error('[local-login] bootstrapUser failed:', err);
        return NextResponse.redirect(new URL('/login?error=local_login_failed', base));
    }

    return NextResponse.redirect(new URL('/dashboard/deals', base));
}
