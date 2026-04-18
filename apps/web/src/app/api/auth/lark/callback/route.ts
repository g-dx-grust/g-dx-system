// Moved to /api/v1/auth/lark/callback – this stub exists only to avoid 404s
// on any hard-coded references to the old path.
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const newUrl = new URL('/api/v1/auth/lark/callback', process.env.APP_URL ?? 'http://localhost:3000');
    // Forward the query string so the callback handler receives code/state/error.
    req.nextUrl.searchParams.forEach((value, key) => newUrl.searchParams.set(key, value));
    return NextResponse.redirect(newUrl);
}
