import { NextRequest, NextResponse } from 'next/server';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export function isLocalHostname(hostname: string): boolean {
    return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost');
}

export function isStrictLocalDevelopmentRequest(request: NextRequest): boolean {
    return process.env.APP_ENV === 'local' && isLocalHostname(request.nextUrl.hostname);
}

export function requireCronAuthorization(request: NextRequest): NextResponse | null {
    const cronSecret = process.env.CRON_SECRET?.trim();

    if (!cronSecret) {
        return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
    }

    if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return null;
}
